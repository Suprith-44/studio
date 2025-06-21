'use server';
/**
 * @fileOverview A flow for answering questions about the content of an uploaded PDF document.
 *
 * - pdfQuestionAnswering - A function that handles the question answering process.
 * - PdfQuestionAnsweringInput - The input type for the pdfQuestionAnswering function.
 * - PdfQuestionAnsweringOutput - The return type for the pdfQuestionAnswering function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PdfQuestionAnsweringInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "The PDF document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  question: z.string().describe('The question about the PDF content.'),
});
export type PdfQuestionAnsweringInput = z.infer<typeof PdfQuestionAnsweringInputSchema>;

const PdfQuestionAnsweringOutputSchema = z.object({
  answer: z.string().describe('The answer to the question.'),
});
export type PdfQuestionAnsweringOutput = z.infer<typeof PdfQuestionAnsweringOutputSchema>;

export async function pdfQuestionAnswering(input: PdfQuestionAnsweringInput): Promise<PdfQuestionAnsweringOutput> {
  return pdfQuestionAnsweringFlow(input);
}

const prompt = ai.definePrompt({
  name: 'pdfQuestionAnsweringPrompt',
  input: {schema: PdfQuestionAnsweringInputSchema},
  output: {schema: PdfQuestionAnsweringOutputSchema},
  prompt: `You are an AI assistant that answers questions based on the content of a PDF document.

  PDF Content: {{media url=pdfDataUri}}

  Question: {{{question}}}

  Answer:`,
});

const pdfQuestionAnsweringFlow = ai.defineFlow(
  {
    name: 'pdfQuestionAnsweringFlow',
    inputSchema: PdfQuestionAnsweringInputSchema,
    outputSchema: PdfQuestionAnsweringOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
