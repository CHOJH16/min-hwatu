/*
  리얼 민화투 (Real Min-Hwatu) - VibeCoding Edition
  - 이미지 출처: GitHub Open Source (fletchowns/hanafuda-js)
  - 규칙: 한국 민화투 룰 적용 (11월=똥, 12월=비 스왑 적용)
*/

// 화투 이미지 주소 (변경하지 마세요)
const IMG_BASE_URL = "https://raw.githubusercontent.com/fletchowns/hanafuda-js/master/img/cards/";

// 민화투 족보 데이터
// (월, 타입 배열: 0=광, 1=열, 2=띠, 3=피) 순서로 정의
const monthConfig = [
    { m: 1, types: ['gwang', 'ribbon', 'pi', 'pi'] },     // 1월 송학 (광, 홍단, 피, 피)
    { m: 2, types: ['animal', 'ribbon', 'pi', 'pi'] },    // 2월 매조 (열, 홍단, 피, 피)
    { m: 3, types: ['gwang', 'ribbon', 'pi', 'pi'] },     // 3월 벚꽃 (광, 홍단, 피, 피)
    { m: 4, types: ['animal', 'ribbon', 'pi', 'pi'] },    // 4월 흑싸리 (열, 초단, 피, 피)
    { m: 5, types: ['animal', 'ribbon', 'pi', 'pi'] },    // 5월 난초 (열, 초단, 피, 피)
    { m: 6, types: ['animal', 'ribbon', 'pi', 'pi'] },    // 6월 모란 (열, 청단, 피, 피)
    { m: 7, types: ['animal', 'ribbon', 'pi', 'pi'] },    // 7월 홍싸리 (열, 초단, 피, 피)
    { m: 8, types: ['gwang', 'animal', 'pi', 'pi'] },     // 8월 공산 (광, 열, 피, 피)
    { m: 9, types: ['animal', 'ribbon', 'pi', 'pi'] },    // 9월 국화 (열, 청단, 피, 피)
    { m: 10, types: ['animal', 'ribbon', 'pi', 'pi'] },   // 10월 단풍 (열, 청단, 피, 피)
    { m: 11, types: ['gwang', 'pi', 'pi', 'pi'] },        // 11월 오동(똥) (광, 쌍피, 쌍피, 쌍피)
    { m: 12, types: ['gwang', 'animal', 'ribbon', 'pi'] } // 12월 비 (비광, 열, 띠, 쌍피)
];

let deck = [];
let playerHand = [];
let comHand = [];
let field = [];
let playerCaptured = [];
let comCaptured = [];
let turn = 'player'; // 'player' 또는 'com'

// 게임 초기화 및 덱 생성
function createDeck() {
    deck = [];
    
    // 1월부터 12월까지 루프
    for (let i = 0; i < 12; i++) {
        let month = i + 1;
        let config = monthConfig[i];
        
        // 이미지 인덱스 계산 (소스 이미지는 0~47번)
        // 일본 화투 소스 기준: 11월=비, 12월=똥
        // 한국 화투 기준: 11월=똥, 12월=비
        // 따라서 이미지를 가져올 때 인덱스를 교체해줘야 함.
        let baseImgIdx = i * 4;
        
        if (month === 11) baseImgIdx = 44; // 한국 11월(똥) -> 일본 소스 12월(똥) 이미지 사용
        if (month === 12) baseImgIdx = 40; // 한국 12월(비) -> 일본 소스 11월(비) 이미지 사용

        for (let j = 0; j < 4; j++) {
            let type = config.types[j];
            // 민화투 기본 점수
            let score = (type === 'gwang') ? 20 : (type === 'animal') ? 10 : (type === 'ribbon') ? 5 : 0;
            
            // 비광은 광이지만 20점 (일부 룰에선 다르지만 표준 적용)
            // 국화(9월) 열끗은 쌍피로 취급되기도 하지만 여기선 열끗 10점으로 계산
            
            deck.push({
                id: Math.random(),
                month: month,
                type: type,
                score: score,
                img: `${IMG_BASE_URL}${baseImgIdx + j}.gif` // 이미지 주소 결합
            });
        }
    }
}

// 카드 섞기
function shuffle() {
    deck.sort(() => Math.random() - 0.5);
}

// 카드 나누기 (민화투 방식: 10장씩, 바닥 8장)
function deal() {
    playerHand = deck.slice(0, 10);
    comHand = deck.slice(10, 20);
    field = deck.slice(20, 28);
    deck = deck.slice(28); // 남은 덱 저장
}

// 화면 그리기
function render() {
    const pHandDiv = document.getElementById('player-hand');
    const cHandDiv = document.getElementById('com-hand');
    const fieldDiv = document.getElementById('field-cards');
    const pCapDiv = document.getElementById('player-captured');
    const cCapDiv = document.getElementById('com-captured');

    // 내용 비우기
    pHandDiv.innerHTML = '';
    cHandDiv.innerHTML = '';
    fieldDiv.innerHTML = '';
    pCapDiv.innerHTML = '';
    cCapDiv.innerHTML = '';

    // 내 손패 (월 순서로 정렬해서 보여줌)
    playerHand.sort((a,b) => a.month - b.month);
    playerHand.forEach((card, idx) => {
        let el = createCardElement(card);
        el.onclick = () => playerPlay(idx); // 클릭 이벤트 연결
        pHandDiv.appendChild(el);
    });

    // 컴퓨터 손패 (뒷면으로 표시)
    comHand.forEach(() => {
        let el = document.createElement('div');
        el.className = 'card card-back';
        cHandDiv.appendChild(el);
    });

    // 바닥 패
    field.forEach(card => {
        let el = createCardElement(card);
        fieldDiv.appendChild(el);
    });

    // 먹은 패 (점수 높은 순 정렬)
    playerCaptured.sort((a,b) => b.score - a.score);
    playerCaptured.forEach(card => pCapDiv.appendChild(createCardElement(card)));
    
    comCaptured.sort((a,b) => b.score - a.score);
    comCaptured.forEach(card => cCapDiv.appendChild(createCardElement(card)));

    // 점수판 업데이트
    document.getElementById('my-score').innerText = calculateScore(playerCaptured) + '점';
    document.getElementById('com-score').innerText = calculateScore(comCaptured) + '점';
}

// 카드 엘리먼트(태그) 만들기
function createCardElement(card) {
    let div = document.createElement('div');
    div.className = 'card';
    div.style.backgroundImage = `url('${card.img}')`;
    return div;
}

// 플레이어 턴 처리
function playerPlay(index) {
    if (turn !== 'player') return;

    // 카드 내기
    const card = playerHand.splice(index, 1)[0];
    processTurn(card, playerCaptured);
    render();

    // 게임 종료 체크
    if (playerHand.length === 0 && comHand.length === 0) {
        setTimeout(endGame, 500);
    } else {
        turn = 'com';
        showMessage("컴퓨터 생각 중...");
        setTimeout(computerPlay, 1000); // 1초 뒤 컴퓨터 턴
    }
}

// 컴퓨터 턴 처리 (간단한 AI)
function computerPlay() {
    let cardIndex = -1;

    // 1. 바닥에 깔린 패 중 내 손패와 같은 월이 있는지 확인 (먹을거 먼저 내기)
    for(let i=0; i<comHand.length; i++) {
        let c = comHand[i];
        if (field.some(f => f.month === c.month)) {
            cardIndex = i;
            break;
        }
    }

    // 2. 먹을 게 없으면 그냥 첫 번째 카드 냄
    if (cardIndex === -1) cardIndex = 0;

    const card = comHand.splice(cardIndex, 1)[0];
    processTurn(card, comCaptured);
    render();

    if (playerHand.length === 0 && comHand.length === 0) {
        setTimeout(endGame, 500);
    } else {
        turn = 'player';
        showMessage("당신의 차례입니다.");
    }
}

// 턴 공통 로직 (내기 -> 매칭 -> 뒤집기 -> 매칭 -> 가져오기)
function processTurn(card, captureArr) {
    let matched = field.filter(f => f.month === card.month);
    let tempCapture = [];

    // 1. 낸 카드 매칭 확인
    if (matched.length > 0) {
        // 매칭되면 첫번째 것과 가져옴 (바닥에 3장 깔린 경우 등 복잡한 룰은 단순화)
        let target = matched[0];
        field = field.filter(f => f.id !== target.id);
        tempCapture.push(card, target);
    } else {
        // 매칭 안되면 바닥에 둠
        field.push(card);
    }

    // 2. 덱에서 뒤집기 (뒷패)
    if (deck.length > 0) {
        let flipped = deck.pop();
        let matchedFlipped = field.filter(f => f.month === flipped.month);

        if (matchedFlipped.length > 0) {
            let target = matchedFlipped[0];
            field = field.filter(f => f.id !== target.id);
            tempCapture.push(flipped, target);
        } else {
            // 쪽(Kiss): 아까 낸 카드가 매칭 안돼서 바닥에 있는데, 뒤집은 게 그거랑 같으면?
            // 민화투에서 "쪽"은 둘 다 가져옴.
            let justPlayed = field.find(f => f.id === card.id);
            if (justPlayed && justPlayed.month === flipped.month) {
                field = field.filter(f => f.id !== justPlayed.id);
                tempCapture.push(flipped, justPlayed);
                showMessage("쪽! 💋");
            } else {
                field.push(flipped);
            }
        }
    }

    // 3. 가져온 패 저장
    captureArr.push(...tempCapture);
}

// 점수 계산 (민화투 약 적용)
function calculateScore(captured) {
    let score = 0;
    let counts = { 4:0, 10:0, 12:0 }; // 초약, 풍약, 비약 카운트

    captured.forEach(c => {
        score += c.score;
        if (c.month === 4) counts[4]++;
        if (c.month === 10) counts[10]++;
        if (c.month === 12) counts[12]++;
    });

    // 약(보너스) 계산 - 각각 20점
    if (counts[4] === 4) score += 20;  // 초약
    if (counts[10] === 4) score += 20; // 풍약
    if (counts[12] === 4) score += 20; // 비약

    return score;
}

function showMessage(msg) {
    const box = document.getElementById('message-box');
    box.innerText = msg;
    box.style.display = 'block';
    setTimeout(() => { box.style.display = 'none'; }, 1000);
}

function endGame() {
    let myScore = calculateScore(playerCaptured);
    let comScore = calculateScore(comCaptured);
    
    let resultMsg = "";
    if (myScore > comScore) resultMsg = "승리하셨습니다! 🎉";
    else if (myScore < comScore) resultMsg = "패배했습니다... 😭";
    else resultMsg = "무승부입니다.";

    alert(`[게임 종료]\n\n나: ${myScore}점\n컴퓨터: ${comScore}점\n\n${resultMsg}`);
    document.getElementById('restart-btn').parentNode.style.display = 'block';
}

function startGame() {
    document.getElementById('restart-btn').parentNode.style.display = 'none';
    createDeck();
    shuffle();
    deal();
    
    playerCaptured = [];
    comCaptured = [];
    turn = 'player';
    
    render();
    showMessage("게임을 시작합니다!");
}

// 최초 실행 시 버튼만 보여주기 위해 아무것도 안함 (버튼 클릭 시 startGame)