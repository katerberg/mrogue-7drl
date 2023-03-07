import * as ROT from 'rot-js';
import {v4 as uuid} from 'uuid';
import {MAX_LEVEL, MAX_X, MAX_Y} from '../types/consts';
import {coordsToNumberCoords} from '../types/math';
import {
  CellType,
  Coordinate,
  DungeonMap,
  Game,
  ItemType,
  Monster,
  MonsterType,
  NumberCoordinates,
  Player,
} from '../types/SharedTypes';
import {isFreeCell} from './gameActions';
import {getRandomFreeLocation, getSpiralAroundPoint} from '.';

function createMonster(coordinate: Coordinate): Monster {
  const {x, y} = coordsToNumberCoords(coordinate);
  return {x, y, type: MonsterType.Goblin, attackStrength: 1, maxHp: 5, currentHp: 5, monsterId: uuid(), target: null};
}

export function isValidCoordinate(x: number, y: number): boolean {
  return x >= 0 && x <= MAX_X && y >= 0 && y <= MAX_Y;
}

export function isOnExitCell(player: Player, game: Game): boolean {
  return game.dungeonMap[player.mapLevel].exits.some(
    (e) => coordsToNumberCoords(e).x === player.x && coordsToNumberCoords(e).y === player.y,
  );
}

export function getMapLevel(game: Game): number {
  return game.players.length === 0 ? 0 : game.players[0].mapLevel;
}

function getExits(centerPoint: NumberCoordinates, game: Game): Coordinate[] {
  const spacesAroundExit = getSpiralAroundPoint(centerPoint);
  const exits: Coordinate[] = [];
  let exitI = 0;
  while (exits.length < game.players.length) {
    if (exitI < spacesAroundExit.length) {
      if (isFreeCell(spacesAroundExit[exitI].x, spacesAroundExit[exitI].y, game)) {
        exits.push(`${spacesAroundExit[exitI].x},${spacesAroundExit[exitI].y}`);
      }
      exitI++;
    } else {
      const freeLocation = getRandomFreeLocation(game);
      exits.push(`${freeLocation.x},${freeLocation.y}`);
    }
  }
  return exits;
}

export function createMap(game: Game): DungeonMap {
  const dungeonMap: DungeonMap = [];

  const map = new ROT.Map.Digger(MAX_X, MAX_Y, {dugPercentage: 0.1, corridorLength: [0, 5]});

  for (let i = 0; i < MAX_LEVEL; i++) {
    dungeonMap[i] = {cells: {}, monsters: [], playerSpawn: '0,0', monsterSpawn: [], exits: []};
    const mapCreationCallback = (x: number, y: number, value: number): void => {
      const type = value === 0 ? CellType.Earth : CellType.Wall;
      dungeonMap[i].cells[`${x},${y}`] = {
        x,
        y,
        type,
        isPassable: value === 0,
        isEntrance: false,
        isExit: false,
        isWalkable: value === 0,
        items: [],
      };
    };
    map._options.dugPercentage = (i + 1) * 0.2;
    map.create(mapCreationCallback);
    const rooms = map.getRooms();
    rooms.forEach((room, roomI) => {
      const [centerX, centerY] = room.getCenter();
      if (roomI === 0) {
        dungeonMap[i].playerSpawn = `${centerX},${centerY}`;
      } else {
        dungeonMap[i].monsterSpawn.push(`${centerX},${centerY}`);
      }

      room.getDoors((doorx, doory) => {
        if (
          dungeonMap[i].cells[`${doorx - 1},${doory}`]?.type === CellType.Earth ||
          dungeonMap[i].cells[`${doorx + 1},${doory}`]?.type === CellType.Earth
        ) {
          dungeonMap[i].cells[`${doorx},${doory}`].type = CellType.HorizontalDoor;
        } else {
          dungeonMap[i].cells[`${doorx},${doory}`].type = CellType.VerticalDoor;
        }
      });
    });

    const [exitX, exitY] = rooms[rooms.length - 1].getCenter();
    if (i !== MAX_LEVEL - 1) {
      getExits({x: exitX, y: exitY}, game).forEach((exit) => {
        dungeonMap[i].exits.push(exit);
        dungeonMap[i].cells[exit].type = CellType.Exit;
      });
    } else {
      dungeonMap[i].cells[`${exitX},${exitY}`].items.push({id: uuid(), type: ItemType.Trophy});
    }

    dungeonMap[i].monsterSpawn.forEach((ms) => {
      dungeonMap[i].monsters.push(createMonster(ms));
    });
  }
  return dungeonMap;
}
