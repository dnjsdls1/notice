// 전역변수 선언
// 제이쿼리처럼 짧게 사용하기 위한 부분
const $ = (selector) => document.querySelector(selector);

// 사용하기 위한 메시지 정의
const noticePageMsg = '글을 작성하시겠습니까?';
const noticeMainMsg = '내용은 저장되지 않습니다. \n그래도 메인으로 이동하시겠습니까?'
const nullmsg = '제목과 내용을 입력해야 공지사항을 등록할 수 없습니다.'
const idCheckMsg = '아이디는 영문/숫자 조합 5~12자이어야 합니다.';
const pwdCheckMsg = '비밀번호는 영문/숫자/특수문자 조합 (8~16자)을 입력하셔야 합니다.'
const idpasNullMsg = '아이디 또는 비밀번호를 입력해주세요.';
const nullUserMsg = '등록되지 않은 사용자입니다. \n아이디 비밀번호를 확인해주세요.';
const loddingMsg = '개발중인 기능입니다.';
const validateIdMsg = '이미 존재하는 아이디입니다.';
const registerSuccess = '회원가입 되셨습니다.';
const noticeRoleUser = '글을 작성하려면 로그인 되어있어야 합니다.';

const successMsg = '공지사항을 등록하시겠습니까?';
const updateMsg = '공지사항을 수정하시겠습니까?';
const sessionAuthMsg = '세션이 만료되었습니다. 다시 로그인해주세요.';

let noticeList = JSON.parse(localStorage.getItem('notice')) || []; // 공지사항 리스트 저장
let memberList = JSON.parse(localStorage.getItem('noticeMember')) || []; // 회원 목록
let authData = JSON.parse(localStorage.getItem('userAuth')) || []; // 로그인 유효기간

let trEl;
let tdEl1;
let tdEl2;
let tdEl3;
let tdEl4;
let textSpan1;
let textSpan2;
let textSpan3;
let textSpan4;

let noticeArea;
let noticeTitle;
let tbodyEl;
let theadEl;
let loginId;
let loginPassword;
let loginBox;
let newNotice;

let registerPageId;
let registerPagePw;
let registerPageEmail;

let params;
let noticeNo;
let isAscending = true; // true면 오름차순, false면 내림차순
let countdownInterval;

const idRegex = /^[a-zA-Z0-9]{5,12}$/; // 아이디 정규표현식
const pwdRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*?_]).{8,16}$/; // 비밀번호 정규표현식
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //이메일 정규효현식

// 시퀀스처럼 사용하기 위해 저장해놓은 변수
let counter = parseInt(localStorage.getItem('myCounter')) || 1;

// dom이 모두 로드가 되고 나서
window.addEventListener("DOMContentLoaded", function(){
    if($('.wrapper')){ // 공지 사항 메인일 때 실행
        tbodyEl = $('#tableDiv tbody');
        theadEl = $('#tableDiv thead');
        loginId = $('#login-id');
        loginPassword = $('#login-password');
        loginBox = $('#loginBox');
        newNotice = $('#newNotice');
        // 로그인 된 아이디가 없을 때 글을 쓸 수 없도록 버튼 안보이게 함
        if(!authData.id) {
            newNotice.classList.add('none');
        }
        // 공지사항 리스트 그려주는 부분
        noticeListRender();
        bindEvents('main');
    } else if($('#register')){ // 회원가입 페이지일 떄 실행
        registerPageId = $('#userId');
        registerPagePw = $('#userPw');
        registerPageEmail = $('#userEmail');
        bindEvents('register');
    } else{ // 공지사항 등록 페이지일 때 실행
        params = new URLSearchParams(window.location.search);
        noticeNo = params.get('noticeNo');

        noticeArea = $('#noticeArea');
        noticeTitle = $('#noticeTitle');
        // 메인 화면에서 공지사항 부분을 클릭하여서 들어온 경우
        // 공지사항의 키값이 들어있다면
        if (noticeNo) {
            noticeDetailClickPage(noticeNo)
        }
        bindEvents('notice');
    }
});

window.addEventListener('pageshow', function(event) {
    // 사용자가 캐시된 페이지로 돌아왔을 때만 새로고침
    // 뒤로가기로 돌아온 후 새로고침
    if (event.persisted) {
        window.location.reload();
    }
});

function bindEvents(page) {
    const handlers = { 
        'main': bindMainEvents, 
        'notice': bindNoticeEvents, 
        'register': bindRegisterEvents 
    };
    
    // 선택한 페이지의 함수를 실행합니다.
    // '?' 연산자는 해당 키가 없을 경우 undefined를 반환하여 에러를 방지합니다.
    handlers[page]?.();
}

// 메인 페이지 이벤트들
function bindMainEvents(){
    loginId.addEventListener('keydown', enterEvent); // 엔터
    loginPassword.addEventListener('keydown', enterEvent); //엔터
    newNotice.addEventListener('click', noticePageMove); // 글쓰기
    theadEl.addEventListener('click', noticefilter); // 공지 헤더부분 클릭
    $('#loginBtn').addEventListener('click', login); // 로그인 버튼
    $('#id-search').addEventListener('click', idPwdSearch); //아이디 찾기
    $('#pwd-search').addEventListener('click', idPwdSearch); // 비밀번호 찾기
    $('#register-btn').addEventListener('click', memberRegister); // 회원가입
    // const savedAuth = JSON.parse(localStorage.getItem('userAuth'));
    // if(savedAuth && savedAuth.expiry) {
        // 저장된 authData에서 만료 시간을 가져와 타이머 시작
    // }
    let loginCompleteId = loginSessionCheck(); // 로그인 세션 체크
    if(loginCompleteId){
        loginSuccessForm(loginCompleteId);
        startLoginTimer(authData.expiry);
    }
}

// 공지사항 페이지 이벤트들
function bindNoticeEvents() {
    $('#cancel').addEventListener('click', noticeMainMove);
    $('#noticeInsert').addEventListener('click', noticeInsert);
}

// 회원가입 페이지 이벤트들
function bindRegisterEvents() {
    $('#register-page-btn').addEventListener('click', registerPageBtn);
    
    // 반복되는 엔터 이벤트 처리
    [registerPageId, registerPagePw, registerPageEmail].forEach(el => {
        el.addEventListener('keydown', (e) => enterEvent(e, "register-page"));
    });
}

// 메인 페이지 함수
function noticeListRender(filter){
    tbodyEl.textContent = "";
    if(noticeList.length <= 0){
        noticeCreateRender(null, 0, false);
        return;
    }else{
        if(filter){
            noticeList.forEach(function(notice, idx){
                noticeCreateRender(notice, idx);
            });
        }else{
            noticeList.reverse().forEach(function(notice, idx){
                noticeCreateRender(notice, idx);
            });
        }
    }
}

// 공지사항 정렬
function noticefilter(e){
    const targetTh = e.target.closest('th');
    
    if (targetTh) {
        isAscending = !isAscending;
        const idValue = targetTh.id;

        noticeList.sort((a, b) => {
            let valA = a[idValue];
            let valB = b[idValue];

            // 숫자 비교를 위해 타입 변환
            if (!isNaN(valA) && !isNaN(valB)) {
                valA = Number(valA);
                valB = Number(valB);
            }

            let comparison = 0;
            if (valA < valB) comparison = -1;
            else if (valA > valB) comparison = 1;
            
            // 내림차순일 경우 결과값에 -1을 곱해 뒤집음
            return isAscending ? comparison : comparison * -1;
        });
    }
    // 3. 클래스 관리 (이전 정렬 클래스 초기화 후 추가)
    // 모든 th에서 정렬 클래스 제거
    document.querySelectorAll('th').forEach(th => th.classList.remove('asc', 'desc'));
    
    // 클릭한 th에만 클래스 추가
    targetTh.classList.add(isAscending ? 'asc' : 'desc');
    noticeListRender('filter');
}

function noticeCreateRender(notice, idx, boolean){
    // const noticeNo = noticeList.length - idx;
    
    trEl = document.createElement('tr');
    tdEl1 = document.createElement('td');
    tdEl2 = document.createElement('td');
    tdEl3 = document.createElement('td');
    tdEl4 = document.createElement('td');
    textSpan1 = document.createElement('span');
    textSpan2 = document.createElement('span');
    textSpan3 = document.createElement('span');
    textSpan4 = document.createElement('span');

    if(boolean === false){
        tdEl1.colSpan = '4';
        tdEl1.textContent = '등록된 공지사항이 없습니다.';
        tbodyEl.appendChild(trEl);
        trEl.appendChild(tdEl1);
    }else{
        textSpan1.textContent = notice.noticeNo;
        textSpan2.textContent = notice.title;
        textSpan3.textContent = notice.userId; // 추후 공지사항 등록시 아이디 추가하여 바꾸어야함
        textSpan4.textContent = notice.createAt;
        
        textSpan1.className = 'text-clickable';
        textSpan1.addEventListener('click', mainNoticeDetail);
        textSpan2.className = 'text-clickable';
        textSpan2.addEventListener('click', mainNoticeDetail);
        textSpan3.className = 'text-clickable';
        textSpan3.addEventListener('click', mainNoticeDetail);
        textSpan4.className = 'text-clickable';
        textSpan4.addEventListener('click', mainNoticeDetail);

        tbodyEl.appendChild(trEl);
        trEl.appendChild(tdEl1);
        tdEl1.append(textSpan1);
        trEl.appendChild(tdEl2);
        tdEl2.append(textSpan2);
        trEl.appendChild(tdEl3);
        tdEl3.append(textSpan3);
        trEl.appendChild(tdEl4);
        tdEl4.append(textSpan4);
    }   
}

function mainNoticeDetail(e){
    const targetTd = e.target.closest('td');
    const targetTr = targetTd.closest('tr');

    if (targetTr && targetTr.cells.length > 0) {
        const firstTdValue = targetTr.cells[0].innerText.trim();
        
        location.href = `notice.html?noticeNo=${firstTdValue}`;
    }
}

function login(){
    if(loginId.value === "" || loginPassword.value === ""){
        alert(idpasNullMsg);
        return;
    }else if(!idRegex.test(loginId.value)){
        alert(idCheckMsg);
        return;
    }else if(!pwdRegex.test(loginPassword.value)){
        alert(pwdCheckMsg);
        return;
    }else{
        let localId;
        memberList.forEach(function(m, idx){
            localId = loginCheck(m, idx);
        })
        
        if(localId){
            loginSuccessForm(localId);
            newNotice.classList.remove('none');
            window.location.reload(true);
            startLoginTimer(authData.expiry);
        }else{
            alert(nullUserMsg);
        }

    }
}

function loginCheck(m, idx){
    if(m.id === loginId.value && m.pwd === loginPassword.value){
        return m.id;
    }else{
        return "";
    }
}

function loginSuccessForm(nowId){
    const welcomeDiv = document.createElement('div');
    const logoutBtn = document.createElement('button');

    welcomeDiv.textContent = `${nowId}님 환영합니다.`;
    logoutBtn.textContent = '로그아웃';
    logoutBtn.className = 'logout';
    logoutBtn.addEventListener('click', SessionLogout);

    loginBox.replaceChildren(welcomeDiv);
    loginBox.appendChild(logoutBtn);
    loginSessionSave(nowId);
}

// 시간체크용 함수 
function timeCheck(time){
    const date = new Date(time);

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    // 시:분:초 형식으로 출력 (padStart를 사용하여 01:05:09 처럼 만듦)
    const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return timeString;
}

function loginSessionCheck(){
    // const authDataString = localStorage.getItem('userAuth');
    // const authData = JSON.parse(localStorage.getItem('userAuth'))
    const sessionNowTime = new Date().getTime();
    if (!authData) return null;
    
    // 시간이 지났는지 확인
    if (sessionNowTime > authData.expiry) {
        localStorage.removeItem('userAuth'); // 만료되면 삭제
        alert(sessionAuthMsg);
        return null;
    }

    return authData.id; // 로그인 유지 중
}

function startLoginTimer(expiry){
    if(!expiry) return;
    const timerDisplay = $('#timeDiv');
    
    // 기존 타이머가 있다면 초기화
    if (countdownInterval) clearInterval(countdownInterval);

    // 1초마다 실행
    countdownInterval = setInterval(() => {
        // 매초 현재 시간을 다시 가져와야 합니다!
        const realNowTime = new Date().getTime();
        const timeLeft = expiry - realNowTime; // 남은 밀리초
        
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            alert(sessionAuthMsg);
            localStorage.removeItem('userAuth');
            location.reload();
            return;
        }

        // 밀리초를 분:초 형식으로 변환
        const minutes = Math.floor(timeLeft / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        // 화면 표시 (요소가 존재할 때만)
        if (timerDisplay) {
            timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

function idPwdSearch(){
    alert(loddingMsg); // 아이디 찾기, 비밀번호 찾기 로직은 시간이 남는다면 구현
}

function memberRegister(){
    location.href = "register.html"; // 이동할 파일명 또는 경로
}

// 엔터 이벤트
function enterEvent(e, str){
    if(e.key === "Enter"){
        if(str){
            registerPageBtn(); // 회원가입 페이지 엔터
        }else{
            login(); // 메인화면 엔터
        }
    }
}

// 로그인 유지값 확인용 저장
function loginSessionSave(localId){
    // 30분 후의 시간 계산 (밀리초 단위)
    const expireTime = new Date().getTime() + (30 * 60 * 1000);
    // 30초
    // const expireTime = new Date().getTime() + (30 * 1000);

    authData = {
        id: localId,
        expiry: expireTime
    };

    localStorage.setItem('userAuth', JSON.stringify(authData));
}

function SessionLogout(){
    localStorage.removeItem('userAuth'); // 세션끊어버리기
    location.reload(); // 화면 갱신
}

// 서브 페이지 함수
function noticePageMove(){
    if (authData.length === 0){
        alert(noticeRoleUser);
        return;
    }

    if(confirm(noticePageMsg)){
        location.href = "notice.html"; // 이동할 파일명 또는 경로
    }
}

function noticeMainMove(){
    if(confirm(noticeMainMsg)){
        history.back(); // 돌아가기
    }
}

function noticeDetailClickPage(seq){
    // localstorge에 저장해둔 공지사항 리스트와 비교하여 일치하는것의 제목과 내용을 가져옴
    const noticeIndex = noticeList.findIndex(n => n.noticeNo === Number(seq));
    if (noticeIndex !== -1) {
        noticeTitle.value = noticeList[noticeIndex].title;
        noticeArea.textContent = noticeList[noticeIndex].content;
    }
    $('#noticeInsert').textContent = '수정';

    const index = noticeList.findIndex(n => n.userId === authData.id);
    if(index === -1){
        noticeTitle.disabled = true;
        noticeArea.disabled = true;
        $('#noticeInsert').disabled = true;
        $('#noticeInsert').style.backgroundColor = '#efe7e7';
        // $('#noticeInsert').style.cursor = 'pointer';
        // $('#cancel').disabled = true;
    }
}

function noticeInsert(){
    const loginId = loginSessionCheck();
    if(loginId === null){
        location.href = "index.html";
        return;
    }

    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0'); // 7월을 '07'로 변환
    const day = String(new Date().getDate()).padStart(2, '0');      // 2일을 '02'로 변환

    const formattedDate = `${year}-${month}-${day}`; // 2026-07-06으로 나오도록 포맷

    if(!noticeArea.value || !noticeTitle.value) {
        alert(nullmsg) 
        return;
    }

    let msg;
    if(params.get('noticeNo')){
        msg = updateMsg;
    }else{
        msg = successMsg;
    }

    if(confirm(msg)){
        if(noticeNo){
            const index = noticeList.findIndex(n => n.noticeNo === Number(noticeNo));
            if (index !== -1) {
                // 값 수정
                noticeList[index].title = noticeTitle.value;
                noticeList[index].content = noticeArea.value;
            }
        }else{
            const notice = {
                noticeNo : getNextId(),
                userId : authData.id,
                title : noticeTitle.value,
                content : noticeArea.value,
                createAt : formattedDate,
            }
            noticeList.push(notice);
            // saveNotice();
        }
        saveNotice();
        location.href = "index.html"; // 이동할 파일명 또는 경로
    }
}

function saveNotice(member) {
    if(!member){
        localStorage.setItem('notice', JSON.stringify(noticeList));
    }else{
        localStorage.setItem('noticeMember', JSON.stringify(memberList));
    }
}

// 회원가입 페이지 함수
function registerPageBtn(){
    // 초기화
    document.querySelectorAll('.error').forEach(el => el.style.display = 'none');
    
    let isValid = true;

    // 아이디 중복 검사
    memberList.forEach(function(member, idx){
        isValid = checkIdDuplication(member, idx);
    });

    if(!isValid){
        alert(validateIdMsg);
        return;
    }

    if (!idRegex.test(registerPageId.value)) {
        $('#idError').style.display = 'block';
        isValid = false;
    }
    if (!pwdRegex.test(registerPagePw.value)) {
        $('#pwError').style.display = 'block';
        isValid = false;
    }
    if (!emailRegex.test(registerPageEmail.value)) {
        $('#emailError').style.display = 'block';
        isValid = false;
    }
    
    if (isValid) {
        alert(registerSuccess);

        const noticeMember = {
            id: registerPageId.value,
            pwd: registerPagePw.value,
            email: registerPageEmail.value,
            gender: $('#userGender').value,
            deleteUser : false,
        }
        memberList.push(noticeMember);
        saveNotice('member');
        location.href = "index.html";
    }
}

function checkIdDuplication(member, idx){
    if(registerPageId.value === member.id){
        return false;
    }else{
        return true;
    }
}


// 시퀀스용
function getNextId() {
    const id = counter++;
    localStorage.setItem('myCounter', counter); // 저장
    return id;
}