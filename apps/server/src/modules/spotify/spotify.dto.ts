import type {
  SpotifyAuthorizeRequest,
  SpotifyOauthExchangeRequest,
  SpotifyPlayerCommandRequest
} from "@wodit/types";

export class SpotifyOauthAuthorizeDto implements SpotifyAuthorizeRequest {
  redirectUri!: string;
  state?: string;
}

export class SpotifyOauthExchangeDto implements SpotifyOauthExchangeRequest {
  email!: string;
  code!: string;
  redirectUri!: string;
}

export class SpotifySdkTokenDto {
  email!: string;
}

export class SpotifyPlayerCommandDto implements SpotifyPlayerCommandRequest {
  email!: string;
  deviceId?: string;
  contextUri?: string;
}
