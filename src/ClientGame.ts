import * as paper from 'paper';
import {MAX_X, MAX_Y} from '../types/consts';
import {Cell, CellType, Coordinate, Game, MapLevel, Messages, Player} from '../types/SharedTypes';
import {BLACK, WHITE} from './colors';

const xVisibleCells = 7;
const yVisibleCells = 11;
const cellPadding = 1;

export class ClientGame {
  map: MapLevel[];

  level: number;

  drawnMap: {[key: Coordinate]: paper.Path};

  players: Player[];

  constructor(players: Player[]) {
    this.players = players;
    this.drawnMap = {};
    this.level = 0;
    this.map = [{}];
    for (let x = 0; x <= MAX_X; x++) {
      for (let y = 0; y <= MAX_Y; y++) {
        this.map[this.level][`${x},${y}`] = {
          type: CellType.Earth,
          x,
          y,
          isPassable: true,
          isWalkable: true,
          isEntrance: false,
          isExit: false,
        };
      }
    }
    globalThis.socket.on(Messages.TurnEnd, this.handleTurnEnd.bind(this));
    this.drawMap();
  }

  private get currentPlayer(): Player {
    return this.players.find((player) => player.playerId === globalThis.playerId) as Player;
  }

  private handleTurnEnd(gameId: string, game: Game): void {
    if (gameId !== globalThis.currentGameId) {
      return;
    }

    this.players.forEach((thisPlayer) => {
      const updatedPlayer = game.players.find((gamePlayer) => gamePlayer.playerId === thisPlayer.playerId) as Player;
      thisPlayer.x = updatedPlayer.x;
      thisPlayer.y = updatedPlayer.y;
    });
    this.drawMap();
  }

  private handleCellClick(xOffset: number, yOffset: number): void {
    if (Math.abs(xOffset) < 2 && Math.abs(yOffset) < 2) {
      const x = this.currentPlayer.x + xOffset;
      const y = this.currentPlayer.y + yOffset;
      if (this.players.find((player) => player.x === x && player.y === y)) {
        return;
      }

      globalThis.socket.emit(Messages.MovePlayer, globalThis.currentGameId, x, y);
    }
  }

  private drawCell(offsetX: number, offsetY: number, cell: Cell): void {
    const {width} = globalThis.gameElement.getBoundingClientRect();
    const cellWidth = (width - cellPadding * 2 * xVisibleCells) / xVisibleCells;
    const xFromCenter = (xVisibleCells - 1) / 2;
    const yFromCenter = (yVisibleCells - 1) / 2;
    const circlePoint = new paper.Point(
      cellWidth / 2 + (offsetX + xFromCenter) * cellWidth + cellPadding + cellPadding * 2 * (offsetX + xFromCenter),
      cellWidth / 2 + (offsetY + yFromCenter) * cellWidth + cellPadding + cellPadding * 2 * (offsetY + yFromCenter),
    );
    const myCircle = new paper.Path.Circle(circlePoint, cellWidth / 2);
    const occupyingPlayer = this.players.find(
      (loopingPlayer) => loopingPlayer.x === cell.x && loopingPlayer.y === cell.y,
    );
    const player = this.currentPlayer;
    const text = new paper.PointText({
      point: circlePoint,
      justification: 'center',
      fontSize: 10,
      fillColor: occupyingPlayer ? new paper.Color(occupyingPlayer.textColor) : WHITE,
      content: `${offsetX + player.x},${offsetY + player.y}`,
    });
    myCircle.addChild(text);
    myCircle.fillColor = occupyingPlayer ? new paper.Color(occupyingPlayer.color) : BLACK;
    myCircle.strokeColor = BLACK;
    const clickHandler = (): void => this.handleCellClick(offsetX, offsetY);
    text.onClick = clickHandler;
    myCircle.onClick = clickHandler;
    this.drawnMap[`${offsetX},${offsetY}`] = myCircle;
  }

  private drawMap(): void {
    Object.entries(this.drawnMap).forEach(([key, cell]) => {
      cell.remove();
      delete this.drawnMap[key as Coordinate];
    });
    const player = this.currentPlayer;
    const xFromCenter = (xVisibleCells - 1) / 2;
    const yFromCenter = (yVisibleCells - 1) / 2;
    for (let offsetX = -1 * xFromCenter; offsetX <= xFromCenter; offsetX++) {
      for (let y = -1 * yFromCenter; y <= yFromCenter; y++) {
        const cell = this.map[this.level][`${player.x + offsetX},${player.y + y}`];
        if (cell !== undefined) {
          //Tile
          this.drawCell(offsetX, y, cell);
        } else {
          //Wall
        }
      }
    }
  }
}
