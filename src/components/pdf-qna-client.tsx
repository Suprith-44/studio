"use client";

import * as React from "react";
import { pdfQuestionAnswering } from "@/ai/flows/pdf-question-answering";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Sparkles, Trash2, UploadCloud } from "lucide-react";

export function PdfQnaClient() {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [pdfName, setPdfName] = React.useState<string | null>(null);
  const [pdfDataUri, setPdfDataUri] = React.useState<string | null>(null);
  const [question, setQuestion] = React.useState<string>("");
  const [answer, setAnswer] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);

  const handleFileChange = (file: File | null) => {
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload a PDF file.",
        });
        return;
      }

      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPdfName(file.name);
        setPdfDataUri(e.target?.result as string);
        setIsUploading(false);
        toast({
          title: "PDF Uploaded",
          description: `${file.name} is ready for questions.`,
        });
      };
      reader.onerror = () => {
        setIsUploading(false);
        toast({
          variant: "destructive",
          title: "File Read Error",
          description: "There was an error reading the file.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemovePdf = () => {
    setPdfName(null);
    setPdfDataUri(null);
    setAnswer("");
    setQuestion("");
    toast({
      title: "PDF Removed",
      description: "You can now upload a new PDF.",
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pdfDataUri) {
      toast({
        variant: "destructive",
        title: "No PDF Uploaded",
        description: "Please upload a PDF to ask questions.",
      });
      return;
    }
    if (!question.trim()) {
      toast({
        variant: "destructive",
        title: "No Question Asked",
        description: "Please enter a question.",
      });
      return;
    }

    setIsLoading(true);
    setAnswer("");

    try {
      const result = await pdfQuestionAnswering({ pdfDataUri, question });
      setAnswer(result.answer);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "An Error Occurred",
        description:
          "Failed to get an answer. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen container mx-auto p-4 md:p-8">
      <div className="grid md:grid-cols-2 gap-12">
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold font-headline">PDF Insight</h1>
            <p className="text-muted-foreground">
              Upload a PDF document and ask questions about its content.
            </p>
          </div>
          
          {pdfDataUri ? (
            <Card className="bg-card/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="text-primary" />
                  Uploaded PDF
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="font-medium truncate pr-4">{pdfName}</p>
                <Button variant="ghost" size="icon" onClick={handleRemovePdf}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                dragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                disabled={isUploading}
              />
              <div className="space-y-4 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="font-semibold">Drag & drop a PDF here, or click to select</p>
                <p className="text-sm text-muted-foreground">PDF files only</p>
              </div>
              {isUploading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <p>Uploading...</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Ask a question about the PDF..."
              className="min-h-[120px] text-base"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={!pdfDataUri || isLoading}
            />
            <Button
              type="submit"
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={!pdfDataUri || isLoading}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Ask
            </Button>
          </form>

          <Card className="flex-grow">
            <CardHeader>
              <CardTitle>Answer</CardTitle>
              <CardDescription>
                The answer from the AI will appear below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : answer ? (
                <p className="whitespace-pre-wrap">{answer}</p>
              ) : (
                <p className="text-muted-foreground">No answer yet. Ask a question to begin.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
