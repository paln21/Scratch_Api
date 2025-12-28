const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

// 1. Cookieを保存する「瓶(Jar)」を作成
const jar = new CookieJar();

// 2. Cookie管理機能付きのクライアントを作成
// これにより、サーバーから送られてきたCookie(scratchcsrftoken, scratchsessionsidなど)が
// 自動的に jar に保存され、次のリクエストで自動送信されます。
const client = wrapper(axios.create({
    jar,
    withCredentials: true,
    headers: {
        // ブラウザのふりをするための基本的なヘッダー
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://scratch.mit.edu/'
    }
}));

async function loginAndGetToken() {
    // --- 設定: ここにユーザー名とパスワードを入力 ---
    // Note: D0nt Publish Github on PassW0rd!
    const USERNAME = 'Y0ur User Name'; 
    const PASSWORD = 'Y0ur Password'; 
    // ---------------------------------------------

    try {
        console.log('1. CSRFトークンを取得中...');
        // 初回アクセス。ここで応答ヘッダーのSet-Cookieにより scratchcsrftoken が jar に入る
        await client.get('https://scratch.mit.edu/csrf_token/');

        // jarからCookieを取り出して確認（デバッグ用）
        // 非同期処理なので同期的に取得できるgetCookiesSync等を使用するか、Promiseで取得
        const cookies = await jar.getCookies('https://scratch.mit.edu');
        const csrfCookie = cookies.find(c => c.key === 'scratchcsrftoken');
        
        if (!csrfCookie) {
            throw new Error('CSRFトークンの取得に失敗しました。');
        }
        const csrfToken = csrfCookie.value;
        console.log(`   取得成功: ${csrfToken}`);

        console.log('2. ログインを実行中...');
        // ログインリクエスト
        // POST時には、CookieにあるCSRFトークンと同じ値をヘッダーの「X-CSRFToken」にも入れる必要があります
        const response = await client.post('https://scratch.mit.edu/accounts/login/', {
            username: USERNAME,
            password: PASSWORD,
            useMessages: true // これを含めると詳細なレスポンスが返ってくる
        }, {
            headers: {
                'X-CSRFToken': csrfToken
            }
        });

        // レスポンスの解析
        // 成功するとユーザー情報の配列が返ってくることが多い
        const userData = response.data[0];

        if (userData && userData.token) {
            console.log('\n--- 認証成功! ---');
            console.log(`Username: ${userData.username}`);
            console.log(`User ID : ${userData.id}`);
            console.log(`X-Token : ${userData.token}`);
            
            // この時点で jar の中には認証済みの scratchsessionsid が入っています。
            // client を使い回せば、ログイン状態が必要な他のAPIも叩けます。
            
            return userData.token;
        } else {
            console.error('ログインできましたが、トークンが見つかりません。レスポンス:', response.data);
        }

    } catch (error) {
        if (error.response) {
            console.error(`エラー: サーバーがステータスコード ${error.response.status} を返しました`);
            console.error(error.response.data);
        } else {
            console.error('エラー:', error.message);
        }
    }
}

// 実行
loginAndGetToken().then(token => {
    if(token) {
        // ここでtokenを使った次の処理（プロジェクト情報の取得など）ができます
        console.log('\n(次のステップ: このX-Tokenを使ってAPI操作が可能です)');
    }
});