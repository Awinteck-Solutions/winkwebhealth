export enum MonitorType {
  HTTP = "HTTP",
  KEYWORD = "KEYWORD",
  PORT = "PORT",
}

export enum KeywordType {
  EXISTS = "EXISTS",
  NOT_EXISTS = "NOT_EXISTS",
}

export enum MonitorStatus {
  UP = "UP",
  DOWN = "DOWN",
  PAUSED = "PAUSED",
  PENDING = "PENDING",
}

export enum CheckStatus {
  UP = "UP",
  DOWN = "DOWN",
}

export enum AlertChannelType {
  EMAIL = "EMAIL",
  DISCORD = "DISCORD",
  SLACK = "SLACK",
  WEBHOOK = "WEBHOOK",
}
