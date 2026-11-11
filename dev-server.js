/**
 * ==============================================================================
 * MOMENT 감성 분석 서비스 - 로컬 통합 개발 서버 (Local Dev Server)
 * 파일명: dev-server.js
 * 설명: 로컬 컴퓨터에서 프론트엔드 정적 파일(HTML/CSS/JS)과 
 *       백엔드 서버리스 함수(POST /api/analyze)를 한 번에 실행해 주는 간이 서버입니다.
 * 실행 방법: node --env-file=.env dev-server.js
 * ==============================================================================
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Modules 환경에서 __dirname 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// api/analyze.js 핸들러 함수 불러오기
import analyzeHandler from './api/analyze.js';

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME 타입 사전 (브라우저가 파일 종류를 인식하도록 돕는 헤더)
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// HTTP 서버 생성
const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // --------------------------------------------------------------------------
    // 1. 백엔드 API 요청 라우팅: POST /api/analyze
    // --------------------------------------------------------------------------
    if (pathname === '/api/analyze') {
        if (req.method === 'POST') {
            let bodyData = '';
            
            // 데이터 조각(chunk) 수신
            req.on('data', chunk => {
                bodyData += chunk;
                // 악의적인 대용량 요청 공격 방지 (최대 1MB)
                if (bodyData.length > 1e6) {
                    req.destroy();
                }
            });

            // 수신 완료 후 API 핸들러 실행
            req.on('end', async () => {
                try {
                    req.body = bodyData ? JSON.parse(bodyData) : {};
                } catch (e) {
                    req.body = {};
                }

                // Vercel Serverless Function 스타일의 response 헬퍼 객체 추가
                res.status = function(code) {
                    this.statusCode = code;
                    return this;
                };
                res.json = function(data) {
                    this.setHeader('Content-Type', 'application/json; charset=utf-8');
                    this.end(JSON.stringify(data));
                    return this;
                };

                // 실제 API 로직 실행
                try {
                    await analyzeHandler(req, res);
                } catch (apiError) {
                    console.error("API 실행 중 에러:", apiError);
                    if (!res.writableEnded) {
                        res.status(500).json({
                            ok: false,
                            error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다.' }
                        });
                    }
                }
            });
            return;
        } else {
            // POST가 아닌 메서드는 405 Method Not Allowed 반환
            res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: false, message: 'POST 요청만 지원합니다.' }));
            return;
        }
    }

    // --------------------------------------------------------------------------
    // 2. 프론트엔드 정적 파일 서빙 (public/ 폴더)
    // --------------------------------------------------------------------------
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

    // 보안 검사: 상위 디렉터리 접근(디렉터리 트래버설 공격) 방지
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('접근이 거부되었습니다.');
        return;
    }

    // 파일 존재 여부 확인 후 응답
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('요청하신 파일을 찾을 수 없습니다 (404 Not Found).');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    });
});

// ------------------------------------------------------------------------------
// 3. 서버 시작
// ------------------------------------------------------------------------------
server.listen(PORT, () => {
    console.log("==================================================================");
    console.log(`[MOMENT] 로컬 개발 서버가 성공적으로 실행되었습니다!`);
    console.log(`- 접속 주소: http://localhost:${PORT}`);
    console.log(`- 프론트엔드 화면과 AI 백엔드(/api/analyze)가 모두 연결되어 있습니다.`);
    console.log(`- 서버를 종료하려면 터미널에서 Ctrl + C 를 누르세요.`);
    console.log("==================================================================");
});

