import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;

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

    // Word documents (.docx, .doc) - not supported in browser, recommend text extraction on server
    if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword' ||
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc')
    ) {
      throw new Error('Word documents are not supported yet. Please convert to PDF or plain text first.');
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
 * Parse PDF files and extract text content using PDF.js (browser-compatible)
 */
async function parsePDF(file: File): Promise<ParsedDocument> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const numPages = pdf.numPages;
    let fullText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items into a single string
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }

    // Get metadata
    const metadata = await pdf.getMetadata();
    const metadataInfo = metadata.info as any;
    
    if (!fullText || fullText.trim().length === 0) {
      return {
        text: '',
        metadata: {
          pageCount: numPages,
          fileType: 'pdf',
          extractionSuccess: false,
          errorMessage: 'PDF appears to be empty or contains only images (no selectable text)',
        },
      };
    }

    return {
      text: fullText.trim(),
      metadata: {
        pageCount: numPages,
        author: metadataInfo?.Author,
        createdAt: metadataInfo?.CreationDate ? new Date(metadataInfo.CreationDate) : undefined,
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
    'text/plain',
  ];

  const fileName = file.name.toLowerCase();
  const documentExtensions = ['.pdf', '.txt'];

  return (
    documentTypes.includes(file.type) ||
    documentExtensions.some((ext) => fileName.endsWith(ext))
  );
}
