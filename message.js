const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const inquirer = require('inquirer');

// --- グローバル変数 ---
const jar = new CookieJar();
// 基本クライアント（Cookie管理対応）
const client = wrapper(axios.create({
    jar,
    withCredentials: true,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://scratch.mit.edu/'
    }
}));

// 現在のユーザー情報を保持
let currentUser = {
    username: '',
    id: '',
    xToken: ''
};

// --- メイン処理 ---
async function main() {
    console.log('\n=== Scratch API Tool (Node.js) ===');
    
    // 1. 認証モードの選択
    const initChoice = await inquirer.prompt([
        {
            type: 'list',
            name: 'mode',
            message: '認証方法を選択してください:',
            choices: [
                { name: '🔑 ユーザー名とパスワードでログイン', value: 'login' },
                { name: '🎫 取得済みのToken(X-Token)をセット', value: 'token' }
            ]
        }
    ]);

    let authSuccess = false;

    if (initChoice.mode === 'login') {
        // パスワード認証フロー
        authSuccess = await flowLogin();
    } else {
        // Token直接入力フロー
        authSuccess = await flowSetToken();
    }

    if (!authSuccess) {
        console.log('認証に失敗またはキャンセルされたため終了します。');
        return;
    }

    // 2. メインメニュー (ループ)
    while (true) {
        console.log('\n-----------------------------------');
        console.log(`現在のユーザー: ${currentUser.username}`);
        
        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: '何をしますか？ (矢印キーで選択)',
                choices: [
                    { name: '📩 未読メッセージ数を確認', value: 'checkMessages' },
                    { name: '👤 自分のプロフィール情報を表示', value: 'getProfile' },
                    { name: '🚀 プロジェクト情報を取得 (ID指定)', value: 'getProject' },
                    { name: '🚪 終了する', value: 'exit' }
                ]
            }
        ]);

        if (answer.action === 'exit') {
            console.log('さようなら！');
            break;
        }

        try {
            await handleAction(answer.action);
        } catch (err) {
            console.error('エラーが発生しました:', err.message);
        }
        
        // 少し待機
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// --- アクション分岐 ---
async function handleAction(action) {
    switch (action) {
        case 'checkMessages':
            await getMessageCount();
            break;
        case 'getProfile':
            await getUserProfile();
            break;
        case 'getProject':
            const input = await inquirer.prompt([{
                type: 'input',
                name: 'id',
                message: 'プロジェクトID(数字)を入力してください:',
                validate: val => !isNaN(val) ? true : '数字を入力してください'
            }]);
            await getProjectInfo(input.id);
            break;
    }
}

// --- 認証フロー A: パスワードログイン ---
async function flowLogin() {
    const credentials = await inquirer.prompt([
        {
            type: 'input',
            name: 'username',
            message: 'ユーザー名を入力:',
            validate: i => i ? true : '必須です'
        },
        {
            type: 'password',
            name: 'password',
            message: 'パスワードを入力:',
            mask: '*',
            validate: i => i ? true : '必須です'
        }
    ]);

    return await performLogin(credentials.username, credentials.password);
}

// --- 認証フロー B: Token手動セット ---
async function flowSetToken() {
    console.log('\n⚠️ 注意: X-Tokenのみを使用する場合、一部の操作(Cookie必須のもの)は制限される可能性がありますが、\n今回実装されているAPI機能(api.scratch.mit.edu)は概ね動作します。\n');

    const inputs = await inquirer.prompt([
        {
            type: 'input',
            name: 'username',
            message: 'ユーザー名を入力 (APIURL構築用):',
            validate: i => i ? true : '必須です'
        },
        {
            type: 'password', // Tokenも長いので隠して入力させます
            name: 'token',
            message: 'X-Tokenを貼り付けてください:',
            mask: '*', // 表示したくない場合はここを削除すれば見えます
            validate: i => i ? true : '必須です'
        }
    ]);

    // Tokenが有効かテスト通信してみる
    console.log('Tokenの有効性を確認中...');
    try {
        // メッセージカウントを取得してテスト（認証が必要な軽いAPI）
        const res = await client.get(`https://api.scratch.mit.edu/users/${inputs.username}/messages/count`, {
            headers: { 'X-Token': inputs.token }
        });
        
        console.log('✅ Token確認成功！');
        
        // 情報をセット
        currentUser.username = inputs.username;
        currentUser.xToken = inputs.token;
        // IDは取れていないので、必要ならプロフィールAPIを叩いて埋める
        // 今回はとりあえず空でも動くようにしています
        
        return true;

    } catch (e) {
        console.error('❌ Tokenが無効か、ユーザー名が一致しません。');
        if(e.response) console.error(`Status: ${e.response.status}`);
        return false;
    }
}

// --- API機能の実装 ---

async function getMessageCount() {
    console.log('通信中...');
    const res = await client.get(`https://api.scratch.mit.edu/users/${currentUser.username}/messages/count`, {
        headers: { 'X-Token': currentUser.xToken }
    });
    console.log(`\n📬 あなたの未読メッセージ数: 【 ${res.data.count} 】件`);
}

async function getUserProfile() {
    console.log('通信中...');
    const res = await client.get(`https://api.scratch.mit.edu/users/${currentUser.username}`, {
        headers: { 'X-Token': currentUser.xToken }
    });
    const d = res.data;
    console.log(`\n👤 ユーザー名: ${d.username}`);
    console.log(`📍 国: ${d.profile.country}`);
    console.log(`📅 参加日: ${d.history.joined}`);
    console.log(`🆔 ID: ${d.id}`);
}

async function getProjectInfo(projectId) {
    console.log(`プロジェクト(ID:${projectId})を検索中...`);
    try {
        const res = await client.get(`https://api.scratch.mit.edu/projects/${projectId}`, {
            headers: { 'X-Token': currentUser.xToken }
        });
        const p = res.data;
        console.log(`\nタイトル: ${p.title}`);
        console.log(`作者: ${p.author.username}`);
        console.log(`★ お気に入り: ${p.stats.favorites}`);
        console.log(`♥ 好き: ${p.stats.loves}`);
    } catch (e) {
        console.log('❌ エラー:', e.message);
    }
}

// --- ログイン処理（パスワード認証用） ---
async function performLogin(username, password) {
    try {
        console.log('CSRFトークン取得中...');
        await client.get('https://scratch.mit.edu/csrf_token/');
        
        const cookies = await jar.getCookies('https://scratch.mit.edu');
        const csrfToken = cookies.find(c => c.key === 'scratchcsrftoken')?.value;

        if (!csrfToken) throw new Error('CSRFトークン取得失敗');

        console.log('ログイン試行中...');
        const response = await client.post('https://scratch.mit.edu/accounts/login/', {
            username: username,
            password: password,
            useMessages: true
        }, {
            headers: { 'X-CSRFToken': csrfToken }
        });

        const userData = response.data[0];
        if (userData && userData.token) {
            currentUser.username = userData.username;
            currentUser.id = userData.id;
            currentUser.xToken = userData.token;
            console.log(`✅ ログイン成功! ようこそ ${userData.username} さん`);
            return true;
        } else {
            console.log('❌ ログイン失敗');
            return false;
        }
    } catch (error) {
        console.error('通信エラー:', error.message);
        return false;
    }
}

// 実行
main();