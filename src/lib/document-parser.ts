import PDFParse from 'pdf-parse';
import mammoth from 'mammoth';

export interface DocumentMetadata {
  pageCount?: number;
  author?: string;
  createdAt?: Date;
  fileType: 'pdf' | 'docx' | 'doc' | 'txt' | 'unknown';
  extractionSuccess: boolean;
  errorMessage?: string;
}

export interface ParsedDocument {
  text: string;
  metadata: DocumentMetadata;
}

/**
 * Main document parsing function - routes to appropriate parser based on file type
 */
export async function parseDocument(file: File): Promise<ParsedDocument> {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  try {
    // PDF files
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await parsePDF(file);
    }

    // Word documents (.docx)
    if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      return await parseWordDocument(file);
    }

    // Legacy Word documents (.doc)
    if (fileType === 'application/msword' || fileName.endsWith('.doc')) {
      return await parseWordDocument(file);
    }

    // Plain text files
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return await parseTextFile(file);
    }

    // Unsupported file type
    throw new Error(`Unsupported file type: ${fileType || 'unknown'}`);
  } catch (error) {
    console.error('Document parsing error:', error);
    throw error;
  }
}

/**
 * Parse PDF files and extract text content
 */
async function parsePDF(file: File): Promise<ParsedDocument> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const data = await PDFParse(buffer);

    if (!data.text || data.text.trim().length === 0) {
      return {
        text: '',
        metadata: {
          pageCount: data.numpages || 0,
          fileType: 'pdf',
          extractionSuccess: false,
          errorMessage: 'PDF appears to be empty or contains only images (no selectable text)',
        },
      };
    }

    return {
      text: data.text.trim(),
      metadata: {
        pageCount: data.numpages || 0,
        author: data.info?.Author,
        createdAt: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
        fileType: 'pdf',
        extractionSuccess: true,
      },
    };
  } catch (error: any) {
    // Handle password-protected PDFs
    if (error.message?.includes('password') || error.message?.includes('encrypted')) {
      return {
        text: '',
        metadata: {
          fileType: 'pdf',
          extractionSuccess: false,
          errorMessage: 'PDF is password-protected. Please unlock it first.',
        },
      };
    }

    // Handle corrupted PDFs
    throw new Error(`Failed to parse PDF: ${error.message || 'File may be corrupted'}`);
  }
}

/**
 * Parse Word documents (.doc, .docx) and extract text content
 */
async function parseWordDocument(file: File): Promise<ParsedDocument> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    const result = await mammoth.extractRawText({ arrayBuffer });

    if (!result.value || result.value.trim().length === 0) {
      return {
        text: '',
        metadata: {
          fileType: file.name.endsWith('.docx') ? 'docx' : 'doc',
          extractionSuccess: false,
          errorMessage: 'Word document appears to be empty',
        },
      };
    }

    return {
      text: result.value.trim(),
      metadata: {
        fileType: file.name.endsWith('.docx') ? 'docx' : 'doc',
        extractionSuccess: true,
      },
    };
  } catch (error: any) {
    throw new Error(`Failed to parse Word document: ${error.message || 'File may be corrupted'}`);
  }
}

/**
 * Parse plain text files
 */
async function parseTextFile(file: File): Promise<ParsedDocument> {
  try {
    const text = await file.text();

    if (!text || text.trim().length === 0) {
      return {
        text: '',
        metadata: {
          fileType: 'txt',
          extractionSuccess: false,
          errorMessage: 'Text file is empty',
        },
      };
    }

    return {
      text: text.trim(),
      metadata: {
        fileType: 'txt',
        extractionSuccess: true,
      },
    };
  } catch (error: any) {
    throw new Error(`Failed to read text file: ${error.message}`);
  }
}

/**
 * Check if a file is a document type that can be parsed
 */
export function isDocumentFile(file: File): boolean {
  const documentTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'text/plain',
  ];

  const fileName = file.name.toLowerCase();
  const documentExtensions = ['.pdf', '.doc', '.docx', '.txt'];

  return (
    documentTypes.includes(file.type) ||
    documentExtensions.some((ext) => fileName.endsWith(ext))
  );
}
