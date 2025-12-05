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
const node_fetch_1 = __importDefault(require("node-fetch"));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const API_URL = 'http://localhost:3001/api';
        // 1. Login
        console.log('Logging in...');
        const loginRes = yield (0, node_fetch_1.default)(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'master@qs.com', password: '123456' })
        });
        if (!loginRes.ok) {
            console.error('Login failed:', yield loginRes.text());
            return;
        }
        const loginData = yield loginRes.json();
        const token = loginData.token;
        console.log('Login successful, token obtained.');
        // 2. Fetch Companies
        console.log('Fetching companies...');
        const companiesRes = yield (0, node_fetch_1.default)(`${API_URL}/companies`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!companiesRes.ok) {
            console.error('Fetch companies failed:', yield companiesRes.text());
            return;
        }
        const companies = yield companiesRes.json();
        console.log('Companies fetched:', companies);
    });
}
main().catch(console.error);
