const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const inquirer = require('inquirer');

// --- 翻訳データ (Dictionary) ---
const DICTIONARY = {
    en: {
        title: '=== Scratch API Tool (Node.js) ===',
        ask_lang: 'Select Language / 言語を選択してください:',
        ask_auth_mode: 'Please select an authentication method:',
        mode_login: '🔑 Log in with username and password',
        mode_token: '🎫 Set acquired Token (X-Token) manually',
        ask_username: 'Enter Username:',
        ask_password: 'Enter Password:',
        ask_token: 'Paste your X-Token:',
        ask_username_api: 'Enter Username (for API URL):',
        valid_req: 'This field is required.',
        valid_num: 'Please enter a valid number.',
        current_user: 'Current User:',
        menu_msg: 'What do you want to do? (Use arrow keys)',
        act_check_msg: '📩 Check unread messages',
        act_profile: '👤 View profile information',
        act_project: '🚀 Get project info (specify ID)',
        act_send_comment: '💬 Send comment to PROJECT',
        act_send_profile_comment: '👤 Send comment to PROFILE', // Added
        act_exit: '🚪 Exit',
        goodbye: 'GoodBye!',
        ask_proj_id: 'Enter Project ID (number):',
        ask_target_username: 'Enter target username:', // Added
        ask_comment_text: 'Enter your comment:',
        msg_term: 'Terminating due to authentication failure or cancellation.',
        msg_token_note: '\n⚠️ Note: When using only X-Token, some operations requiring cookies may be restricted.\n',
        msg_check_token: 'Checking Token validity...',
        msg_token_ok: '✅ Token confirmed!',
        msg_token_fail: '❌ Invalid Token or Username mismatch.',
        msg_communicating: 'Communicating...',
        msg_csrf: 'Fetching CSRF Token...',
        msg_login_try: 'Attempting Login...',
        msg_login_ok: '✅ Login Successful! Welcome',
        msg_login_fail: '❌ Login Failed',
        msg_error: 'Error:',
        res_unread: '📬 Unread Messages:',
        res_country: '📍 Country:',
        res_joined: '📅 Joined:',
        res_id: '🆔 ID:',
        res_searching: 'Searching for project ID:',
        res_title: 'Title:',
        res_author: 'Author:',
        res_fav: '★ Favorites:',
        res_love: '♥ Loves:',
        res_err_proj: '❌ Project not found or error occurred.',
        res_comment_ok: '✅ Comment posted successfully!',
        res_comment_fail: '❌ Failed to post comment.'
    },
    ja: {
        title: '=== Scratch API ツール (Node.js) ===',
        ask_lang: 'Select Language / 言語を選択してください:',
        ask_auth_mode: '認証方法を選択してください:',
        mode_login: '🔑 ユーザー名とパスワードでログイン',
        mode_token: '🎫 取得済みのToken(X-Token)を手動セット',
        ask_username: 'ユーザー名を入力:',
        ask_password: 'パスワードを入力:',
        ask_token: 'X-Tokenを貼り付け:',
        ask_username_api: 'ユーザー名を入力 (API URL用):',
        valid_req: '入力は必須です。',
        valid_num: '数字を入力してください。',
        current_user: '現在のユーザー:',
        menu_msg: '何をしますか？ (矢印キーで選択)',
        act_check_msg: '📩 未読メッセージ数を確認',
        act_profile: '👤 プロフィール情報を表示',
        act_project: '🚀 プロジェクト情報を取得 (ID指定)',
        act_send_comment: '💬 プロジェクトにコメントを投稿',
        act_send_profile_comment: '👤 ユーザーのプロフィールにコメント', // Added
        act_exit: '🚪 終了する',
        goodbye: 'さようなら！',
        ask_proj_id: 'プロジェクトID(数字)を入力:',
        ask_target_username: '送信先のユーザー名を入力:', // Added
        ask_comment_text: 'コメント内容を入力:',
        msg_term: '認証失敗またはキャンセルのため終了します。',
        msg_token_note: '\n⚠️ 注意: X-Tokenのみを使用する場合、Cookie必須の操作は制限される可能性があります。\n',
        msg_check_token: 'Tokenの有効性を確認中...',
        msg_token_ok: '✅ Token確認成功！',
        msg_token_fail: '❌ Tokenが無効か、ユーザー名が一致しません。',
        msg_communicating: '通信中...',
        msg_csrf: 'CSRFトークン取得中...',
        msg_login_try: 'ログイン試行中...',
        msg_login_ok: '✅ ログイン成功! ようこそ',
        msg_login_fail: '❌ ログイン失敗',
        msg_error: 'エラー:',
        res_unread: '📬 未読メッセージ数:',
        res_country: '📍 国:',
        res_joined: '📅 参加日:',
        res_id: '🆔 ID:',
        res_searching: 'プロジェクトを検索中 ID:',
        res_title: 'タイトル:',
        res_author: '作者:',
        res_fav: '★ お気に入り:',
        res_love: '♥ 好き:',
        res_err_proj: '❌ プロジェクトが見つからないかエラーが発生しました。',
        res_comment_ok: '✅ コメントを投稿しました！',
        res_comment_fail: '❌ コメントの投稿に失敗しました。'
    }
};

let currentLang = 'en'; // 初期値
function t(key) {
    return DICTIONARY[currentLang][key] || key;
}

// --- HTTPクライアント設定 ---
const jar = new CookieJar();
const client = wrapper(axios.create({
    jar,
    withCredentials: true,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://scratch.mit.edu/'
    }
}));

let currentUser = {
    username: '',
    id: '',
    xToken: ''
};

// --- メイン関数 ---
async function main() {
    
    // 言語選択
    const langChoice = await inquirer.prompt([{
        type: 'list', name: 'lang', message: 'Select Language / 言語を選択してください:',
        choices: [{ name: 'English', value: 'en' }, { name: '日本語', value: 'ja' }]
    }]);
    currentLang = langChoice.lang;

    console.log(`\n${t('title')}`);
    
    // 認証モード選択
    const initChoice = await inquirer.prompt([{
        type: 'list', name: 'mode', message: t('ask_auth_mode'),
        choices: [{ name: t('mode_login'), value: 'login' }, { name: t('mode_token'), value: 'token' }]
    }]);

    let authSuccess = false;
    if (initChoice.mode === 'login') {
        authSuccess = await flowLogin();
    } else {
        authSuccess = await flowSetToken();
    }

    if (!authSuccess) {
        console.log(t('msg_term'));
        return;
    }

    // メインループ
    while (true) {
        console.log('\n-----------------------------------');
        console.log(`${t('current_user')} ${currentUser.username}`);
        
        const answer = await inquirer.prompt([{
            type: 'list',
            name: 'action',
            message: t('menu_msg'),
            choices: [
                { name: t('act_check_msg'), value: 'checkMessages' },
                { name: t('act_profile'), value: 'getProfile' },
                { name: t('act_project'), value: 'getProject' },
                { name: t('act_send_comment'), value: 'sendProjectComment' },
                { name: t('act_send_profile_comment'), value: 'sendProfileComment' }, // Added
                { name: t('act_exit'), value: 'exit' }
            ]
        }]);

        if (answer.action === 'exit') {
            console.log(t('goodbye'));
            break;
        }

        try {
            await handleAction(answer.action);
        } catch (err) {
            console.error(`${t('msg_error')} ${err.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// --- アクション分岐 ---
async function handleAction(action) {
    switch (action) {
        case 'checkMessages': await getMessageCount(); break;
        case 'getProfile': await getUserProfile(); break;
        case 'getProject':
            const pInput = await inquirer.prompt([{
                type: 'input', name: 'id', message: t('ask_proj_id'), validate: val => !isNaN(val) ? true : t('valid_num')
            }]);
            await getProjectInfo(pInput.id);
            break;
        case 'sendProjectComment': await sendProjectComment(); break;
        case 'sendProfileComment': await sendProfileComment(); break; // Added
    }
}

// --- 認証フロー ---
async function flowLogin() {
    const creds = await inquirer.prompt([
        { type: 'input', name: 'username', message: t('ask_username'), validate: i => i ? true : t('valid_req') },
        { type: 'password', name: 'password', message: t('ask_password'), mask: '*', validate: i => i ? true : t('valid_req') }
    ]);
    return await performLogin(creds.username, creds.password);
}

async function flowSetToken() {
    console.log(t('msg_token_note'));
    const inputs = await inquirer.prompt([
        { type: 'input', name: 'username', message: t('ask_username_api'), validate: i => i ? true : t('valid_req') },
        { type: 'password', name: 'token', message: t('ask_token'), mask: '*', validate: i => i ? true : t('valid_req') }
    ]);
    console.log(t('msg_check_token'));
    try {
        await client.get(`https://api.scratch.mit.edu/users/${inputs.username}/messages/count`, {
            headers: { 'X-Token': inputs.token }
        });
        console.log(t('msg_token_ok'));
        currentUser.username = inputs.username;
        currentUser.xToken = inputs.token;
        return true;
    } catch (e) {
        console.error(t('msg_token_fail'));
        return false;
    }
}

async function performLogin(username, password) {
    try {
        console.log(t('msg_csrf'));
        await client.get('https://scratch.mit.edu/csrf_token/');
        
        const cookies = await jar.getCookies('https://scratch.mit.edu');
        const csrfToken = cookies.find(c => c.key === 'scratchcsrftoken')?.value;
        if (!csrfToken) throw new Error('CSRF Token Error');

        console.log(t('msg_login_try'));
        const response = await client.post('https://scratch.mit.edu/accounts/login/', {
            username: username, password: password, useMessages: true
        }, { headers: { 'X-CSRFToken': csrfToken } });

        const userData = response.data[0];
        if (userData && userData.token) {
            currentUser = { username: userData.username, id: userData.id, xToken: userData.token };
            console.log(`${t('msg_login_ok')} ${userData.username}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`${t('msg_error')} ${error.message}`);
        return false;
    }
}

// --- 各機能の実装 ---

async function getMessageCount() {
    console.log(t('msg_communicating'));
    const res = await client.get(`https://api.scratch.mit.edu/users/${currentUser.username}/messages/count`, {
        headers: { 'X-Token': currentUser.xToken }
    });
    console.log(`\n${t('res_unread')} 【 ${res.data.count} 】`);
}

async function getUserProfile() {
    console.log(t('msg_communicating'));
    const res = await client.get(`https://api.scratch.mit.edu/users/${currentUser.username}`, {
        headers: { 'X-Token': currentUser.xToken }
    });
    const d = res.data;
    console.log(`\n${t('ask_username')} ${d.username}\n${t('res_country')} ${d.profile.country}\n${t('res_joined')} ${d.history.joined}\n${t('res_id')} ${d.id}`);
}

async function getProjectInfo(projectId) {
    console.log(`${t('res_searching')} ${projectId}...`);
    try {
        const res = await client.get(`https://api.scratch.mit.edu/projects/${projectId}`);
        const p = res.data;
        console.log(`\n${t('res_title')} ${p.title}\n${t('res_author')} ${p.author.username}\n${t('res_fav')} ${p.stats.favorites}\n${t('res_love')} ${p.stats.loves}`);
    } catch (e) { console.log(t('res_err_proj')); }
}

// A: プロジェクトへのコメント
async function sendProjectComment() {
    const input = await inquirer.prompt([
        { type: 'input', name: 'id', message: t('ask_proj_id'), validate: val => !isNaN(val) ? true : t('valid_num') },
        { type: 'input', name: 'content', message: t('ask_comment_text'), validate: i => i ? true : t('valid_req') }
    ]);
    console.log(t('msg_communicating'));
    try {
        const csrfToken = (await jar.getCookies('https://scratch.mit.edu')).find(c => c.key === 'scratchcsrftoken')?.value;
        const response = await client.post(`https://api.scratch.mit.edu/proxy/comments/project/${input.id}/`, {
            content: input.content, parent_id: "", commentee_id: ""
        }, {
            headers: { 'X-Token': currentUser.xToken, 'X-CSRFToken': csrfToken }
        });
        if (response.status === 200 || response.status === 201) console.log(t('res_comment_ok'));
    } catch (e) {
        console.error(t('res_comment_fail'));
        if (e.response && e.response.status === 429) console.error("⚠️ Rate limit: Please wait a bit.");
        else console.error(e.message);
    }
}

// B: プロフィールへのコメント (NEW!)
async function sendProfileComment() {
    const input = await inquirer.prompt([
        { type: 'input', name: 'username', message: t('ask_target_username'), validate: i => i ? true : t('valid_req') },
        { type: 'input', name: 'content', message: t('ask_comment_text'), validate: i => i ? true : t('valid_req') }
    ]);
    console.log(t('msg_communicating'));
    try {
        // プロフィール用はエンドポイントが異なります (site-api)
        // ここでは X-Token よりも Cookie と Referer が重要になります
        const url = `https://scratch.mit.edu/site-api/comments/user/${input.username}/add/`;
        
        const csrfToken = (await jar.getCookies('https://scratch.mit.edu')).find(c => c.key === 'scratchcsrftoken')?.value;
        
        const response = await client.post(url, {
            content: input.content,
            parent_id: "",
            commentee_id: ""
        }, {
            headers: {
                'X-CSRFToken': csrfToken,
                // プロフィールコメントはRefererチェックが厳しい
                'Referer': `https://scratch.mit.edu/users/${input.username}/`
            }
        });

        if (response.status === 200 || response.status === 201) console.log(t('res_comment_ok'));
    } catch (e) {
        console.error(t('res_comment_fail'));
        if (e.response && e.response.status === 403) {
            console.error("⚠️ 403 Forbidden: 認証エラー。ログインモードでないと動作しない場合があります。");
        } else if (e.response && e.response.status === 429) {
            console.error("⚠️ Rate limit: 少し待ってから実行してください。");
        } else {
            console.error(e.message);
        }
    }
}

// 実行
main();