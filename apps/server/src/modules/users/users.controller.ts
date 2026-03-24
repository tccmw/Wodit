import { Body, Controller, Get, Patch, Post, Query } from "@nestjs/common";
import { SubmitFeedbackDto, SyncUserDto, UpdateProfileDto } from "./users.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post("sync")
  sync(@Body() body: SyncUserDto) {
    return this.usersService.syncUser(body);
  }

  @Get("profile")
  getProfile(@Query("email") email: string) {
    return this.usersService.getPersistedProfileByEmail(email);
  }

  @Patch("profile")
  updateProfile(@Body() body: UpdateProfileDto) {
    return this.usersService.updateProfile(body);
  }

  @Post("feedback")
  submitFeedback(@Body() body: SubmitFeedbackDto) {
    return this.usersService.submitFeedback(body);
  }
}
