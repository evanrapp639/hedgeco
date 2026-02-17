// Document router - Fund document upload and management

import { z } from 'zod';
import { router, protectedProcedure, managerProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

// Document types enum matching Prisma schema
const DocumentType = z.enum(['PITCH_DECK', 'TEARSHEET', 'FACTSHEET', 'DDQ', 'OTHER']);
type DocumentTypeType = z.infer<typeof DocumentType>;

// Map custom document types to FundDocumentType enum
const documentTypeMapping: Record<DocumentTypeType, string> = {
  PITCH_DECK: 'MARKETING_DECK',
  TEARSHEET: 'FACTSHEET',
  FACTSHEET: 'FACTSHEET',
  DDQ: 'DDQ',
  OTHER: 'OTHER',
};

// S3 client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  } : undefined,
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'hedgeco-documents';
const UPLOAD_EXPIRY = 3600; // 1 hour for upload URLs
const DOWNLOAD_EXPIRY = 3600; // 1 hour for download URLs

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'application/vnd.ms-powerpoint', // ppt
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const documentRouter = router({
  /**
   * Get a presigned URL for uploading a document
   */
  getUploadUrl: managerProcedure
    .input(
      z.object({
        filename: z.string().min(1),
        contentType: z.string().refine(
          (type) => ALLOWED_MIME_TYPES.includes(type),
          { message: 'File type not allowed. Allowed types: PDF, Excel, PowerPoint, Word' }
        ),
        fileSize: z.number().max(MAX_FILE_SIZE, 'File size exceeds 50MB limit').optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { filename, contentType } = input;
      
      // Generate unique document ID and S3 key
      const documentId = randomUUID();
      const ext = filename.split('.').pop() || 'pdf';
      const s3Key = `documents/${ctx.user.sub}/${documentId}.${ext}`;

      // Generate presigned upload URL
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: UPLOAD_EXPIRY,
      });

      return {
        uploadUrl,
        documentId,
        s3Key,
        expiresAt: new Date(Date.now() + UPLOAD_EXPIRY * 1000),
      };
    }),

  /**
   * Confirm upload and link document to a fund
   */
  confirmUpload: managerProcedure
    .input(
      z.object({
        fundId: z.string(),
        documentId: z.string(),
        s3Key: z.string(),
        filename: z.string(),
        contentType: z.string(),
        fileSize: z.number(),
        type: DocumentType,
        title: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { fundId, documentId, s3Key, filename, contentType, fileSize, type, title } = input;

      // Verify fund exists and user is the manager
      const fund = await ctx.prisma.fund.findUnique({
        where: { id: fundId },
      });

      if (!fund) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fund not found',
        });
      }

      if (fund.managerId !== ctx.user.sub && 
          ctx.user.role !== 'ADMIN' && 
          ctx.user.role !== 'SUPER_ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not authorized to upload documents for this fund',
        });
      }

      // Map the document type
      const fundDocumentType = documentTypeMapping[type] as 'FACTSHEET' | 'DDQ' | 'MARKETING_DECK' | 'OTHER';

      // Create the document record
      const document = await ctx.prisma.fundDocument.create({
        data: {
          id: documentId,
          fundId,
          documentType: fundDocumentType,
          title: title || filename,
          fileName: filename,
          fileUrl: `s3://${BUCKET_NAME}/${s3Key}`,
          fileSize,
          mimeType: contentType,
          fileHash: documentId, // Using documentId as placeholder; in production, compute actual hash
          uploadedBy: ctx.user.sub,
        },
      });

      // Log activity
      await ctx.prisma.userActivity.create({
        data: {
          userId: ctx.user.sub,
          action: 'DOWNLOAD', // Using DOWNLOAD as proxy for UPLOAD
          entityType: 'DOCUMENT',
          entityId: document.id,
          metadata: {
            action: 'upload',
            fundId,
            documentType: type,
          },
        },
      });

      return document;
    }),

  /**
   * List documents for a fund
   */
  list: protectedProcedure
    .input(
      z.object({
        fundId: z.string(),
        type: DocumentType.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { fundId, type } = input;

      // Verify fund exists and user has access
      const fund = await ctx.prisma.fund.findUnique({
        where: { id: fundId },
        select: {
          id: true,
          managerId: true,
          status: true,
          visible: true,
        },
      });

      if (!fund) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fund not found',
        });
      }

      // Check access based on fund visibility and user role
      const isManager = fund.managerId === ctx.user.sub;
      const isAdmin = ctx.user.role === 'ADMIN' || ctx.user.role === 'SUPER_ADMIN';
      
      if (!fund.visible && !isManager && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this fund',
        });
      }

      // Build the where clause
      const whereClause = type 
        ? { fundId, documentType: documentTypeMapping[type] as 'MARKETING_DECK' | 'FACTSHEET' | 'DDQ' | 'OTHER' }
        : { fundId };

      const documents = await ctx.prisma.fundDocument.findMany({
        where: whereClause,
        orderBy: { uploadedAt: 'desc' },
        select: {
          id: true,
          documentType: true,
          title: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          uploadedAt: true,
          accessLevel: true,
          version: true,
        },
      });

      return documents;
    }),

  /**
   * Delete a document (manager only)
   */
  delete: managerProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { documentId } = input;

      const document = await ctx.prisma.fundDocument.findUnique({
        where: { id: documentId },
        include: {
          fund: {
            select: {
              id: true,
              managerId: true,
            },
          },
        },
      });

      if (!document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found',
        });
      }

      // Check authorization
      if (document.fund.managerId !== ctx.user.sub && 
          ctx.user.role !== 'ADMIN' && 
          ctx.user.role !== 'SUPER_ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not authorized to delete this document',
        });
      }

      // Extract S3 key from fileUrl
      const s3Key = document.fileUrl.replace(`s3://${BUCKET_NAME}/`, '');

      // Delete from S3
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
        });
        await s3Client.send(deleteCommand);
      } catch (error) {
        console.error('Failed to delete from S3:', error);
        // Continue with database deletion even if S3 fails
      }

      // Delete from database
      await ctx.prisma.fundDocument.delete({
        where: { id: documentId },
      });

      return { success: true };
    }),

  /**
   * Get a presigned download URL for a document
   */
  getDownloadUrl: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { documentId } = input;

      const document = await ctx.prisma.fundDocument.findUnique({
        where: { id: documentId },
        include: {
          fund: {
            select: {
              id: true,
              managerId: true,
              status: true,
              visible: true,
            },
          },
        },
      });

      if (!document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found',
        });
      }

      // Check access based on document access level and user
      const isManager = document.fund.managerId === ctx.user.sub;
      const isAdmin = ctx.user.role === 'ADMIN' || ctx.user.role === 'SUPER_ADMIN';
      
      // Check document access level
      if (document.accessLevel === 'PRIVATE' && !isManager && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This document is private',
        });
      }

      if (document.accessLevel === 'ACCREDITED') {
        // Check if user is accredited
        const profile = await ctx.prisma.profile.findUnique({
          where: { userId: ctx.user.sub },
          select: { accredited: true, accreditationExpires: true },
        });

        const isAccredited = profile?.accredited && 
          (!profile.accreditationExpires || profile.accreditationExpires > new Date());

        if (!isAccredited && !isManager && !isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'This document requires accredited investor status',
          });
        }
      }

      // Extract S3 key from fileUrl
      const s3Key = document.fileUrl.replace(`s3://${BUCKET_NAME}/`, '');

      // Generate presigned download URL
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        ResponseContentDisposition: `attachment; filename="${document.fileName}"`,
      });

      const downloadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: DOWNLOAD_EXPIRY,
      });

      // Log activity
      await ctx.prisma.userActivity.create({
        data: {
          userId: ctx.user.sub,
          action: 'DOWNLOAD',
          entityType: 'DOCUMENT',
          entityId: document.id,
          metadata: {
            fundId: document.fund.id,
            documentType: document.documentType,
          },
        },
      });

      return {
        downloadUrl,
        fileName: document.fileName,
        contentType: document.mimeType,
        expiresAt: new Date(Date.now() + DOWNLOAD_EXPIRY * 1000),
      };
    }),
});
