import './index.scss';
import './start-screen.scss';
import './game-lobby.scss';
import './games-lobby.scss';
import * as paper from 'paper';
import {io} from 'socket.io-client';
import {Game} from '../types/SharedTypes';
import {BLACK} from './colors';
import {populatePlayerList} from './waiting-room';

// screen.orientation?.lock('portrait');

let socketId: paper.PointText;

function initCanvasSize(canvas: HTMLCanvasElement): void {
  const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  canvas.width = 1000; //horizontal resolution (?) - increase for better looking text
  canvas.height = 1778; //vertical resolution (?) - increase for better looking text
  canvas.style.width = `${width}`; //actual width of canvas
  canvas.style.height = `${height}`; //actual height of canvas
  globalThis.gameElement = canvas;
}

function drawSocketId(socket: string): void {
  socketId?.remove();
  socketId = new paper.PointText({
    point: paper.view.center.transform(new paper.Matrix().translate(0, 230)),
    justification: 'center',
    fontSize: 20,
    fillColor: BLACK,
    content: `Socket ID
    ${socket}`,
  });
}

async function handleCreateGame(): Promise<void> {
  const createdGame: Game = await fetch('http://localhost:8081/api/games', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((response) => response.json());
  globalThis.socket.on('currentGames', (gamesList) => {
    drawSocketId(globalThis.socket.id);
    console.log('games', gamesList); //eslint-disable-line no-console
  });
  globalThis.socket.on('joinedGame', (game) => {
    populatePlayerList(game.players);
  });
  const startScreen = document.getElementById('start-screen');
  const gameLobby = document.getElementById('game-lobby');
  if (startScreen && gameLobby) {
    gameLobby.classList.add('visible');
    startScreen.classList.remove('visible');
  }
  populatePlayerList(createdGame.players);
}

async function joinGame(gameId: string): Promise<void> {
  const joinedGame: Game = await fetch(`http://localhost:8081/api/games/${gameId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((response) => response.json());
  const gamesLobby = document.getElementById('games-lobby');
  const gameLobby = document.getElementById('game-lobby');
  if (gamesLobby && gameLobby) {
    gameLobby.classList.add('visible');
    gamesLobby.classList.remove('visible');
  }
  populatePlayerList(joinedGame.players);
}

function joinGameHandler(event: MouseEvent): void {
  const button = event.target as HTMLElement;
  const gameId = button.getAttribute('data-game-id');
  if (gameId) {
    joinGame(gameId);
  }
}

function populateGamesList(games: Game[]): void {
  const gamesLobbyList = document.getElementById('games-lobby-list');
  if (gamesLobbyList) {
    while (gamesLobbyList.firstChild) {
      gamesLobbyList.removeChild(gamesLobbyList.firstChild);
    }

    let gameList = '<div>';
    games.forEach((game) => {
      gameList += `<div><span>${game.gameId}</span><button class="join" data-game-id="${game.gameId}">Join</button></div>`;
    });
    gameList += '</div>';
    gamesLobbyList.innerHTML = gameList;
    const allButtons: NodeListOf<HTMLElement> = document.querySelectorAll('button[class=join]');

    for (let i = 0; i < allButtons.length; i++) {
      if (allButtons[i]) {
        allButtons[i].onclick = joinGameHandler;
      }
    }
  }
}

async function openGamesList(): Promise<void> {
  const startScreen = document.getElementById('start-screen');
  const gamesLobbyScreen = document.getElementById('games-lobby');
  if (startScreen && gamesLobbyScreen) {
    gamesLobbyScreen.classList.add('visible');
    startScreen.classList.remove('visible');
  }
  const games = await fetch('http://localhost:8081/api/games', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((response) => response.json());
  populateGamesList(games);
  globalThis.socket.on('currentGames', (gamesList) => {
    populateGamesList(gamesList);
  });
}

window.addEventListener('load', () => {
  const gameElement = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (gameElement) {
    gameElement.onwheel = (event): void => {
      event.preventDefault();
    };

    initCanvasSize(gameElement);
    paper.setup(globalThis.gameElement);

    const createGameButton = document.getElementById('create-game');
    if (createGameButton) {
      createGameButton.onclick = handleCreateGame;
    }

    const openGamesListButton = document.getElementById('open-games-list');
    if (openGamesListButton) {
      openGamesListButton.onclick = openGamesList;
    }
    globalThis.socket = io('http://localhost:8081');
  }
});
