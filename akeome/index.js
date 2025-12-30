// action_sender.js
const axios = require('axios');
const { wrapper } = require('axios-cookie-jar-support');
const { CookieJar } = require('tough-cookie');

// 環境変数のチェック
const {
    SCRATCH_USERNAME,
    SCRATCH_PASSWORD,
    TARGET_USER,
    COMMENT_CONTENT
} = process.env;

if (!SCRATCH_USERNAME || !SCRATCH_PASSWORD || !TARGET_USER || !COMMENT_CONTENT) {
    console.error('❌ エラー: 必要な環境変数 (USERNAME, PASSWORD, TARGET, CONTENT) が設定されていません。');
    process.exit(1);
}

// HTTPクライアント設定
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

async function main() {
    console.log(`\n🚀 自動実行開始: ${TARGET_USER} への送信`);

    try {
        // 1. ログイン処理
        console.log('🔄 ログイン中...');
        await client.get('https://scratch.mit.edu/csrf_token/');
        const cookies = await jar.getCookies('https://scratch.mit.edu');
        const csrfToken = cookies.find(c => c.key === 'scratchcsrftoken')?.value;

        if (!csrfToken) throw new Error('CSRFトークン取得失敗');

        const loginRes = await client.post('https://scratch.mit.edu/accounts/login/', {
            username: SCRATCH_USERNAME,
            password: SCRATCH_PASSWORD
        }, {
            headers: { 'X-CSRFToken': csrfToken }
        });

        const userSession = loginRes.data[0];
        if (!userSession || !userSession.token) {
            throw new Error('ログイン失敗: パスワードかユーザー名が間違っています。');
        }
        console.log(`✅ ログイン成功: ${userSession.username}`);

        // 2. コメント送信処理
        console.log(`📨 メッセージ送信中...`);
        
        // 最新のCSRFトークン再取得
        const currentCookies = await jar.getCookies('https://scratch.mit.edu');
        const currentCsrf = currentCookies.find(c => c.key === 'scratchcsrftoken')?.value;

        const url = `https://scratch.mit.edu/site-api/comments/user/${TARGET_USER}/add/`;

        await client.post(url, {
            content: COMMENT_CONTENT,
            parent_id: "",
            commentee_id: ""
        }, {
            headers: {
                'X-CSRFToken': currentCsrf,
                'Referer': `https://scratch.mit.edu/users/${TARGET_USER}/`
            }
        });

        console.log('✅ 送信成功！ 終了します。');

    } catch (e) {
        console.error('❌ 実行エラー');
        if (e.response) {
            console.error(`Status: ${e.response.status} - ${e.response.statusText}`);
        } else {
            console.error(e.message);
        }
        process.exit(1); // エラー終了させる
    }
}

main();