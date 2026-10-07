/** Planned boundaries only. No paid provider or worker is enabled by this module. */
export type JobState = "draft" | "queued" | "running" | "review" | "completed" | "failed" | "cancelled";
export interface MaterialVersionRef { materialId:string; versionId:string; documentSha256:string; rubricVersionId:string }
export interface PrivatePageRef { objectId:string; sha256:string; page:number; width:number; height:number }
export interface ProviderUsage { requestId:string; inputTokens:number; outputTokens:number; pages:number; tariffVersion:string; costMinor:number; currency:string }
export interface RecognizedRegion { page:number; bounds:[number,number,number,number]; text:string; latex?:string; confidence:number; needsReview:boolean }
export interface RecognitionResult { regions:RecognizedRegion[]; usage:ProviderUsage }
export interface ScanRecognitionProvider { readonly id:string; recognize(input:{pages:PrivatePageRef[];idempotencyKey:string;signal:AbortSignal}):Promise<RecognitionResult> }
export interface SuggestedAssessment { taskId:string; given:string; points:number; maxPoints:number; comment:string; uncertainRegions:number[]; needsTeacherReview:true }
export interface AssessmentProvider { readonly id:string; assess(input:{material:MaterialVersionRef;regions:RecognizedRegion[];idempotencyKey:string;signal:AbortSignal}):Promise<{suggestions:SuggestedAssessment[];usage:ProviderUsage}> }
export interface MarpDraftProvider { readonly id:string; draft(input:{confirmedText:string;templateVersion:string;subject:string;pageLimit:number;idempotencyKey:string;signal:AbortSignal}):Promise<{marp:string;answerKey:unknown;usage:ProviderUsage}> }
