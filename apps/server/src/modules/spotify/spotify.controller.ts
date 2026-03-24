import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Redirect
} from "@nestjs/common";
import { SpotifyOauthAuthorizeDto, SpotifyOauthExchangeDto, SpotifyPlayerCommandDto, SpotifySdkTokenDto } from "./spotify.dto";
import { SpotifyService } from "./spotify.service";

@Controller("spotify")
export class SpotifyController {
  constructor(private readonly spotifyService: SpotifyService) {}

  @Get("oauth/authorize")
  @Redirect()
  authorize(@Query() query: SpotifyOauthAuthorizeDto) {
    return {
      url: this.spotifyService.getAuthorizeUrl(query.redirectUri, query.state)
    };
  }

  @Post("oauth/exchange")
  async exchange(@Body() body: SpotifyOauthExchangeDto) {
    try {
      await this.spotifyService.exchangeUserCode(body);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Spotify exchange failed."
      );
    }

    return {
      success: true
    };
  }

  @Get("sdk-token")
  async getSdkToken(@Query() query: SpotifySdkTokenDto) {
    return {
      accessToken: await this.spotifyService.getSdkAccessToken(query.email)
    };
  }

  @Post("player/play")
  async play(@Body() body: SpotifyPlayerCommandDto) {
    await this.spotifyService.playContext(body);
    return { success: true };
  }

  @Post("player/pause")
  async pause(@Body() body: SpotifyPlayerCommandDto) {
    await this.spotifyService.pause(body.email, body.deviceId);
    return { success: true };
  }

  @Post("player/next")
  async next(@Body() body: SpotifyPlayerCommandDto) {
    await this.spotifyService.next(body.email, body.deviceId);
    return { success: true };
  }

  @Post("player/previous")
  async previous(@Body() body: SpotifyPlayerCommandDto) {
    await this.spotifyService.previous(body.email, body.deviceId);
    return { success: true };
  }
}
