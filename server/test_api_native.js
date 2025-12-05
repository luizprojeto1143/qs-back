"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
function request(options, body) {
    return new Promise((resolve, reject) => {
        const req = http_1.default.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch (e) {
                    resolve(data);
                }
            });
        });
        req.on('error', reject);
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // 1. Login
        console.log('Logging in...');
        const loginData = yield request({
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: 'master@qs.com', password: '123456' });
        if (!loginData.token) {
            console.error('Login failed:', loginData);
            return;
        }
        const token = loginData.token;
        console.log('Login successful.');
        // 2. Fetch Companies
        console.log('Fetching companies...');
        const companies = yield request({
            hostname: 'localhost',
            port: 3001,
            path: '/api/companies',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Companies fetched:', companies);
    });
}
main().catch(console.error);
