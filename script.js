/* script.js - 무설치 이모지 버전 (Unbreakable Edition) */

/* 
  이미지 파일 다운로드나 링크 깨짐 걱정 없이,
  이모지(Emoji)를 사용하여 화투패를 표현합니다.
  100% 작동을 보장합니다.
*/

// 월별 이모지 및 구성 설정 (민화투 점수판)
const deckConfig = [
    { m: 1,  icon: '🎍', name: '송학', types: ['광', '띠', '피', '피'], scores: [20, 5, 0, 0] },
    { m: 2,  icon: '🐦', name: '매조', types: ['열', '띠', '피', '피'], scores: [10, 5, 0, 0] },
    { m: 3,  icon: '🌸', name: '벚꽃', types: ['광', '띠', '피', '피'], scores: [20, 5, 0, 0] },
    { m: 4,  icon: '🌿', name: '흑싸리', types: ['열', '띠', '피', '피'], scores: [10, 5, 0, 0] },
    { m: 5,  icon: '💐', name: '난초', types: ['열', '띠', '피', '피'], scores: [10, 5, 0, 0] },
    { m: 6,  icon: '🦋', name: '모란', types: ['열', '띠', '피', '피'], scores: [10, 5, 0, 0] },
    { m: 7,  icon: '🐗', name: '홍싸리', types: ['열', '띠', '피', '피'], scores: [10, 5, 0, 0] },
    { m: 8,  icon: '🌕', name: '공산', types: ['광', '열', '피', '피'], scores: [20, 10, 0, 0] },
    { m: 9,  icon: '🏆', name: '국화', types: ['열', '띠', '피', '피'], scores: [10, 5, 0, 0] },
    { m: 10, icon: '🍁', name: '단풍', types: ['열', '띠', '피', '피'], scores: [10, 5, 0, 0] },
    { m: 11, icon: '🌞', name: '오동', types: ['광', '피', '피', '피'], scores: [20, 0, 0, 0] }, // 똥 (11월)
    { m: 12, icon: '☔', name: '비',   types: ['광', '열', '띠', '피'], scores: [20, 10, 5, 0] }  // 비 (12월)
];

let deck = [];
let playerHand = [];
let comHand = [];
let field = [];
let playerCaptured = [];
let comCaptured = [];
let turn = 'player';

// 덱 생성 (이미지 경로 필요 없음!)
function createDeck() {
    deck = [];
    deckConfig.forEach(cfg => {
        for (let i = 0; i < 4; i++) {
            deck.push({
                id: Math.random(),
                month: cfg.m,
                icon: cfg.icon,  // 이모지
                type: cfg.types[i],
                score: cfg.scores[i],
                monthName: cfg.name
            });
        }
    });
}

function shuffle() { deck.sort(() => Math.random() - 0.5); }

function deal() {
    playerHand = deck.slice(0, 10);
    comHand = deck.slice(10, 20);
    field = deck.slice(20, 28);
    deck = deck.slice(28);
}

// ★ 핵심: CSS로 카드 그리기 ★
function createCardElement(card) {
    let div = document.createElement('div');
    // '광'이나 '띠' 같은 클래스 추가해서 CSS로 꾸밈
    div.className = `card type-${card.type}`;
    
    // HTML 내용 조립 (월, 아이콘, 타입)
    div.innerHTML = `
        <div class="card-month">${card.month}월</div>
        <div class="card-icon">${card.icon}</div>
        <div class="card-type">${card.type}</div>
    `;
    
    return div;
}

function render() {
    const pHandDiv = document.getElementById('player-hand');
    const cHandDiv = document.getElementById('com-hand');
    const fieldDiv = document.getElementById('field-cards');
    const pCapDiv = document.getElementById('player-captured');
    const cCapDiv = document.getElementById('com-captured');

    pHandDiv.innerHTML = ''; cHandDiv.innerHTML = ''; 
    fieldDiv.innerHTML = ''; pCapDiv.innerHTML = ''; cCapDiv.innerHTML = '';

    // 내 손패 (정렬)
    playerHand.sort((a,b) => a.month - b.month);
    playerHand.forEach((card, idx) => {
        let el = createCardElement(card);
        el.onclick = () => playerPlay(idx);
        pHandDiv.appendChild(el);
    });

    // 컴퓨터 손패 (뒷면)
    comHand.forEach(() => {
        let el = document.createElement('div');
        el.className = 'card card-back';
        cHandDiv.appendChild(el);
    });

    // 바닥 패
    field.forEach(card => fieldDiv.appendChild(createCardElement(card)));

    // 먹은 패 (점수순)
    playerCaptured.sort((a,b) => b.score - a.score);
    playerCaptured.forEach(card => pCapDiv.appendChild(createCardElement(card)));
    
    comCaptured.sort((a,b) => b.score - a.score);
    comCaptured.forEach(card => cCapDiv.appendChild(createCardElement(card)));

    document.getElementById('my-score').innerText = calculateScore(playerCaptured) + '점';
    document.getElementById('com-score').innerText = calculateScore(comCaptured) + '점';
}

function playerPlay(index) {
    if (turn !== 'player') return;
    const card = playerHand.splice(index, 1)[0];
    processTurn(card, playerCaptured);
    render();
    if (playerHand.length === 0 && comHand.length === 0) endGame();
    else {
        turn = 'com';
        setTimeout(computerPlay, 1000);
    }
}

function computerPlay() {
    let cardIndex = -1;
    for(let i=0; i<comHand.length; i++) {
        if (field.some(f => f.month === comHand[i].month)) {
            cardIndex = i; break;
        }
    }
    if (cardIndex === -1) cardIndex = 0;
    const card = comHand.splice(cardIndex, 1)[0];
    processTurn(card, comCaptured);
    render();
    if (playerHand.length === 0 && comHand.length === 0) endGame();
    else {
        turn = 'player';
        showMessage("당신의 차례!");
    }
}

function processTurn(card, captureArr) {
    let matched = field.filter(f => f.month === card.month);
    let temp = [];
    if (matched.length > 0) {
        let target = matched[0];
        field = field.filter(f => f.id !== target.id);
        temp.push(card, target);
    } else field.push(card);

    if (deck.length > 0) {
        let flipped = deck.pop();
        let matchedFlip = field.filter(f => f.month === flipped.month);
        if (matchedFlip.length > 0) {
            let target = matchedFlip[0];
            field = field.filter(f => f.id !== target.id);
            temp.push(flipped, target);
        } else {
            let justPlayed = field.find(f => f.id === card.id);
            if (justPlayed && justPlayed.month === flipped.month) {
                field = field.filter(f => f.id !== justPlayed.id);
                temp.push(flipped, justPlayed);
                showMessage("쪽! 💋");
            } else field.push(flipped);
        }
    }
    captureArr.push(...temp);
}

function calculateScore(captured) {
    let score = 0;
    let counts = { 4:0, 10:0, 12:0 };
    captured.forEach(c => {
        score += c.score;
        if ([4,10,12].includes(c.month)) counts[c.month]++;
    });
    if (counts[4] === 4) score += 20;
    if (counts[10] === 4) score += 20;
    if (counts[12] === 4) score += 20;
    return score;
}

function showMessage(msg) {
    const box = document.getElementById('message-box');
    box.innerText = msg;
    box.style.display = 'block';
    setTimeout(() => { box.style.display = 'none'; }, 1000);
}

function endGame() {
    let my = calculateScore(playerCaptured);
    let com = calculateScore(comCaptured);
    let res = my > com ? "승리! 🎉" : my < com ? "패배.. 😭" : "무승부";
    alert(`[게임 종료]\n나: ${my}점 vs 컴: ${com}점\n\n${res}`);
    document.getElementById('restart-btn').parentNode.style.display = 'block';
}

function startGame() {
    document.getElementById('restart-btn').parentNode.style.display = 'none';
    createDeck(); shuffle(); deal();
    playerCaptured = []; comCaptured = []; turn = 'player';
    render(); showMessage("게임 시작!");
}
