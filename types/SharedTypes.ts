export enum PlayerActionName {
  Move,
}
export type PlayerAction = {
  name: PlayerActionName;
  target?: Coordinate;
};

export type Player = {
  x: number;
  y: number;
  playerId: string;
  name: string;
  isHost: boolean;
  socketId?: string;
  maxHp: number;
  currentHp: number;
  color: string;
  textColor: string;
  currentAction: PlayerAction | null;
  mapLevel: number;
};

export enum CellType {
  Earth,
  Wall,
}

export type Cell = {
  x: number;
  y: number;
  isEntrance: boolean;
  isExit: boolean;
  isPassable: boolean;
  isWalkable: boolean;
  type: CellType;
};

export type DungeonMap = MapLevel[];

export type MapLevel = {
  [key: Coordinate]: Cell;
};

export type Coordinate = `${number},${number}`;

export enum GameStatus {
  WaitingForPlayers,
  Ongoing,
  Saved,
  Done,
}

export type Game = {
  gameId: string;
  players: Player[];
  gameStatus: GameStatus;
  startTime: Date;
  turn: number;
  dungeonMap: DungeonMap;
};

export enum Messages {
  LeaveGame = 'leaveGame',
  GameClosed = 'gameClosed',
  GameStarted = 'gameStarted',
  CurrentGames = 'currentGames',
  StartGame = 'startGame',
  PlayersChangedInGame = 'playersChangedInGame',
  ChangeName = 'changeName',
  NameChanged = 'nameChanged',
  MovePlayer = 'movePlayer',
  PlayerActionQueued = 'playerActionQueued',
  TurnEnd = 'turnEnd',
}

export type GamesHash = {[key: string]: Game};

export type OnFrameEvent = {
  delta: number;
  time: number;
  count: number;
};
