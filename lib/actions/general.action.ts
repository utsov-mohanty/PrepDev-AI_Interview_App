"use server";

import { feedbackSchema } from "@/constants";
import { db } from "@/firebase/admin";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";


export async function getInterviewsByUserId(userId: string): Promise<Interview[] | null>{
    const interviews = await db
      .collection('interviews')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get()
  
    return interviews.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as Interview[];
}
  
export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[] | null>{
    const { userId, limit = 20 } = params;
    
    const interviews = await db
      .collection('interviews')
      .orderBy('createdAt', 'desc')
      .where('finalized', '==', true)
      .where('userId', '!=', userId)
      .limit(limit)
      .get();
  
    return interviews.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as Interview[];
}

export async function getInterviewById(id: string): Promise<Interview | null>{
    const interview = await db
      .collection('interviews')
      .doc(id)
      .get();

    return interview.data() as Interview | null;
}

export async function createFeedback(params: CreateFeedbackParams){
  const { interviewId, userId, transcript } = params;
  
  console.log('Creating feedback with params:', { interviewId, userId, transcriptLength: transcript.length });
  
  try {
    const formattedTranscript = transcript
        .map((sentence: { role: string; content: string; }) => (
          `- ${sentence.role}: ${sentence.content}\n`
        )).join('');

    console.log('Formatted transcript length:', formattedTranscript.length);
    console.log('Starting AI generation...');

    const { object: { totalScore, categoryScores,strengths, areasForImprovement, finalAssessment } } = await generateObject({
      model: google("gemini-2.0-flash-001" /* , {
        structuredOutputs: false,
      } */),
      schema: feedbackSchema,
      prompt: `You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
      Transcript:${formattedTranscript}
      
      Please provide feedback in the following format:
      - totalScore: Overall score from 0-100
      - categoryScores: Array of 5 categories with scores and comments:
        1. Communication Skills (clarity, articulation, structured responses)
        2. Technical Knowledge (understanding of key concepts for the role)
        3. Problem Solving (ability to analyze problems and propose solutions)
        4. Cultural Fit (alignment with company values and job role)
        5. Confidence and Clarity (confidence in responses, engagement, and clarity)
      - strengths: Array of 3-5 key strengths
      - areasForImprovement: Array of 3-5 areas that need improvement
      - finalAssessment: Overall assessment paragraph (2-3 sentences)
      `,
      system: "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    console.log('AI generation completed. Saving to Firebase...');
    console.log('Generated data:', { totalScore, categoryScores, strengths, areasForImprovement, finalAssessment });

    const feedback = await db.collection('feedback').add({
      interviewId,
      userId,
      totalScore,
      categoryScores,
      strengths,
      areasForImprovement,
      finalAssessment,
      createdAt: new Date().toISOString()
    })

    console.log('Feedback saved successfully with ID:', feedback.id);

    return {
      success: true,
      feedbackId: feedback.id
    }
  } catch (error) {
    console.error('Error saving feedback:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Test function to verify Firebase connection
export async function testFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...');
    const testDoc = await db.collection('test').add({ test: true, timestamp: new Date().toISOString() });
    console.log('Firebase connection successful:', testDoc.id);
    return { success: true, docId: testDoc.id };
  } catch (error) {
    console.error('Firebase connection failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getFeedbackByInterviewId(params: GetFeedbackByInterviewIdParams): Promise<Feedback | null>{
  const { interviewId, userId } = params;
  
  const feedback = await db
    .collection('feedback')
    .where('interviewId', '==', interviewId)
    .where('userId', '==', userId)
    .limit(1)
    .get();

  if(feedback.empty) return null;

  const feedbackDoc = feedback.docs[0];

  return {
    id: feedbackDoc.id, ...feedbackDoc.data()
  } as Feedback;
}