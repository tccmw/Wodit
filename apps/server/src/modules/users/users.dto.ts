import type { Coordinates, SubmitFeedbackRequest, SyncUserRequest, UpdateProfileRequest } from "@wodit/types";

export class SyncUserDto implements SyncUserRequest {
  email!: string;
  name?: string | null;
  image?: string | null;
}

export class UpdateProfileDto implements UpdateProfileRequest {
  email!: string;
  nickname?: string;
  sensitivity?: number;
  offset?: number;
  location?: Coordinates;
  regionName?: string;
  onboardingCompleted?: boolean;
}

export class SubmitFeedbackDto implements SubmitFeedbackRequest {
  email!: string;
  status!: "TOO_COLD" | "GOOD" | "TOO_HOT";
  weather!: SubmitFeedbackRequest["weather"];
  location!: Coordinates;
  recommendation?: SubmitFeedbackRequest["recommendation"];
}
