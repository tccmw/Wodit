import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  PersistedUserProfile,
  SubmitFeedbackResponse
} from "@wodit/types";
import { applyFeedbackOffset } from "../../../../../packages/utils/src";
import { PrismaService } from "../database/prisma.service";
import { SubmitFeedbackDto, SyncUserDto, UpdateProfileDto } from "./users.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async syncUser(input: SyncUserDto): Promise<PersistedUserProfile> {
    const email = input.email.trim().toLowerCase();
    const displayName = input.name?.trim() || email.split("@")[0] || "Wodit User";

    const user = await this.prisma.user.upsert({
      where: { email },
      update: {
        name: input.name ?? undefined,
        image: input.image ?? undefined
      },
      create: {
        email,
        name: input.name ?? null,
        image: input.image ?? null,
        profile: {
          create: {
            nickname: displayName
          }
        }
      },
      include: {
        profile: true
      }
    });

    if (!user.profile) {
      const profile = await this.prisma.profile.create({
        data: {
          userId: user.id,
          nickname: displayName
        }
      });

      return this.toPersistedProfile({ ...user, profile });
    }

    return this.toPersistedProfile({
      ...user,
      profile: user.profile
    });
  }

  async updateProfile(input: UpdateProfileDto): Promise<PersistedUserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.trim().toLowerCase() },
      include: { profile: true }
    });

    if (!user || !user.profile) {
      throw new NotFoundException("User profile was not found.");
    }

    const profile = await this.prisma.profile.update({
      where: { userId: user.id },
      data: {
        nickname: input.nickname ?? undefined,
        sensitivity: input.sensitivity ?? undefined,
        tempOffset: input.offset ?? undefined,
        homeLat: input.location?.lat ?? undefined,
        homeLng: input.location?.lng ?? undefined,
        homeRegion: input.regionName ?? undefined,
        onboardingCompleted: input.onboardingCompleted ?? undefined
      }
    });

    return this.toPersistedProfile({ ...user, profile });
  }

  async submitFeedback(input: SubmitFeedbackDto): Promise<SubmitFeedbackResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.trim().toLowerCase() },
      include: { profile: true }
    });

    if (!user || !user.profile) {
      throw new NotFoundException("User profile was not found.");
    }

    const nextPreference = applyFeedbackOffset(
      {
        sensitivity: user.profile.sensitivity,
        offset: user.profile.tempOffset,
        nickname: user.profile.nickname
      },
      input.status
    );

    await this.prisma.feedback.create({
      data: {
        userId: user.id,
        status: input.status,
        weatherJson: JSON.stringify(input.weather),
        recommendation: input.recommendation ? JSON.stringify(input.recommendation) : null,
        locationLat: input.location.lat,
        locationLng: input.location.lng
      }
    });

    const profile = await this.prisma.profile.update({
      where: { userId: user.id },
      data: {
        tempOffset: nextPreference.offset
      }
    });

    return {
      profile: this.toPersistedProfile({ ...user, profile })
    };
  }

  async getPersistedProfileByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { profile: true }
    });

    if (!user || !user.profile) {
      return null;
    }

    return this.toPersistedProfile({
      ...user,
      profile: user.profile
    });
  }

  private toPersistedProfile(user: {
    email: string;
    name: string | null;
    image: string | null;
    profile: {
      nickname: string;
      sensitivity: number;
      tempOffset: number;
      homeLat: number;
      homeLng: number;
      homeRegion: string;
      onboardingCompleted: boolean;
      spotifyConnected: boolean;
    };
  }): PersistedUserProfile {
    return {
      email: user.email,
      name: user.name,
      image: user.image,
      nickname: user.profile.nickname,
      sensitivity: user.profile.sensitivity,
      offset: user.profile.tempOffset,
      location: {
        lat: user.profile.homeLat,
        lng: user.profile.homeLng
      },
      regionName: user.profile.homeRegion,
      onboardingCompleted: user.profile.onboardingCompleted,
      spotifyConnected: user.profile.spotifyConnected
    };
  }
}
