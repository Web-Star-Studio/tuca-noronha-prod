"use client";

import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Download, Trash2, FileImage, FileSpreadsheet, File, Camera } from "lucide-react";
import { toast } from "sonner";

interface ProposalDocumentManagerProps {
  proposalId: Id<"packageProposals">;
  canEdit?: boolean;
}

interface FileUpload {
  file: File;
  progress: number;
  storageId?: string;
  error?: string;
}

const getFileIcon = (fileType: string) => {
  if (fileType.includes('image')) return <FileImage className="h-4 w-4" />;
  if (fileType.includes('pdf')) return <FileText className="h-4 w-4" />;
  if (fileType.includes('sheet') || fileType.includes('excel')) return <FileSpreadsheet className="h-4 w-4" />;
  if (fileType.includes('text') || fileType.includes('document')) return <FileText className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
};

const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export function ProposalDocumentManager({ proposalId, canEdit = true }: ProposalDocumentManagerProps) {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const attachments = useQuery(api.domains.packageProposals.documents.getProposalAttachments, {
    proposalId,
  });

  // Mutations
  const generateUploadUrl = useMutation(api.domains.media.mutations.generateUploadUrl);
  const uploadAttachment = useMutation(api.domains.packageProposals.documents.uploadProposalAttachment);
  const removeAttachment = useMutation(api.domains.packageProposals.documents.removeProposalAttachment);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error(`Arquivo "${file.name}" é muito grande. Limite: 50MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Add files to upload queue
    const newUploads: FileUpload[] = validFiles.map(file => ({
      file,
      progress: 0,
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Start uploads
    validFiles.forEach((file, index) => {
      uploadFile(file, uploads.length + index);
    });
  };

  const uploadFile = async (file: File, index: number) => {
    try {
      // Update progress to show upload starting
      setUploads(prev => prev.map((upload, i) => 
        i === index ? { ...upload, progress: 10 } : upload
      ));

      // Get upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Update progress
      setUploads(prev => prev.map((upload, i) => 
        i === index ? { ...upload, progress: 30 } : upload
      ));

      // Upload file to storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();

      // Update progress
      setUploads(prev => prev.map((upload, i) => 
        i === index ? { ...upload, progress: 70, storageId } : upload
      ));

      // Save attachment info to database
      await uploadAttachment({
        proposalId,
        storageId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      // Complete upload
      setUploads(prev => prev.map((upload, i) => 
        i === index ? { ...upload, progress: 100 } : upload
      ));

      toast.success(`Arquivo "${file.name}" enviado com sucesso!`);

      // Remove from upload queue after a delay
      setTimeout(() => {
        setUploads(prev => prev.filter((_, i) => i !== index));
      }, 2000);

    } catch (error) {
      console.error("Error uploading file:", error);
      setUploads(prev => prev.map((upload, i) => 
        i === index ? { ...upload, error: "Erro no upload" } : upload
      ));
      toast.error(`Erro ao enviar arquivo "${file.name}"`);
    }
  };

  const handleRemoveAttachment = async (storageId: string, fileName: string) => {
    try {
      await removeAttachment({
        proposalId,
        storageId,
      });
      toast.success(`Arquivo "${fileName}" removido com sucesso!`);
    } catch (error) {
      console.error("Error removing attachment:", error);
      toast.error(`Erro ao remover arquivo "${fileName}"`);
    }
  };


  const handleDownload = async (storageId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/download-url?storageId=${storageId}&proposalId=${proposalId}`);
      
      if (response.ok) {
        const { url } = await response.json();
        
        if (url) {
          // Create temporary link and trigger download
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          toast.error("Não foi possível obter o link de download");
        }
      } else {
        toast.error("Erro ao obter link de download");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Erro ao baixar arquivo");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Documentos e Anexos</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie documentos, imagens e anexos da proposta
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Enviar Arquivos
            </Button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Enviando Arquivos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploads.map((upload, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{upload.file.name}</span>
                    <span className="text-muted-foreground">
                      {formatFileSize(upload.file.size)}
                    </span>
                  </div>
                  <Progress value={upload.progress} className="h-2" />
                  {upload.error && (
                    <p className="text-xs text-red-500">{upload.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attachments List */}
      <div className="space-y-3">
        {attachments && attachments.length > 0 ? (
          attachments.map((attachment) => (
            <Card key={attachment.storageId} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getFileIcon(attachment.fileType)}
                  </div>
                  <div>
                    <h4 className="font-medium">{attachment.fileName}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatFileSize(attachment.fileSize)}</span>
                      <span>•</span>
                      <span>
                        {new Date(attachment.uploadedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {attachment.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {attachment.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(attachment.storageId, attachment.fileName)}
                    title="Baixar arquivo"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAttachment(attachment.storageId, attachment.fileName)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum documento anexado ainda</p>
              {canEdit && (
                <p className="text-sm mt-2">
                  Clique em &ldquo;Enviar Arquivos&rdquo; para adicionar documentos
                </p>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* File Upload Instructions */}
      {canEdit && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Camera className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">
                  Tipos de arquivo suportados
                </p>
                <p className="text-blue-700">
                  PDF, Word, Excel, PowerPoint, Imagens (JPG, PNG, GIF), TXT
                </p>
                <p className="text-blue-600 mt-2">
                  Tamanho máximo: 50MB por arquivo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
