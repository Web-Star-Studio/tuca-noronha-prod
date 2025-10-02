#!/usr/bin/env bun
/**
 * Script para verificar se todas as funções Convex chamadas no código existem
 * 
 * Usage: bun run scripts/verify-convex-functions.ts
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

interface ConvexCall {
  file: string;
  line: number;
  apiPath: string;
  fullCall: string;
}

const SRC_DIR = path.join(process.cwd(), "src");
const CONVEX_DIR = path.join(process.cwd(), "convex");

// Padrões de chamadas Convex
const PATTERNS = [
  /useQuery\(api\.([a-zA-Z0-9_.]+)/g,
  /useMutation\(api\.([a-zA-Z0-9_.]+)/g,
  /useAction\(api\.([a-zA-Z0-9_.]+)/g,
];

function findConvexCalls(dir: string): ConvexCall[] {
  const calls: ConvexCall[] = [];
  
  function scanDir(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
        const content = fs.readFileSync(fullPath, "utf-8");
        const lines = content.split("\n");
        
        lines.forEach((line, index) => {
          PATTERNS.forEach((pattern) => {
            const matches = line.matchAll(pattern);
            for (const match of matches) {
              if (match[1]) {
                calls.push({
                  file: fullPath.replace(process.cwd() + "/", ""),
                  line: index + 1,
                  apiPath: match[1],
                  fullCall: match[0],
                });
              }
            }
          });
        });
      }
    }
  }
  
  scanDir(dir);
  return calls;
}

function checkConvexFunctionExists(apiPath: string): { exists: boolean; filePath?: string } {
  // Parse api path: pode ser api.domains.X.Y.Z ou api.X.Y
  const parts = apiPath.split(".");
  
  // Caso 1: api.domains.X.queries.Y ou api.domains.X.mutations.Y
  if (parts[0] === "domains" && parts.length >= 3) {
    const domain = parts[1];
    const type = parts[2]; // queries, mutations, actions
    const functionName = parts.slice(3).join(".");
    
    const domainPath = path.join(CONVEX_DIR, "domains", domain, `${type}.ts`);
    if (fs.existsSync(domainPath)) {
      const content = fs.readFileSync(domainPath, "utf-8");
      // Verificar se a função está exportada
      const exportPattern = new RegExp(`export (const|function) ${functionName.split(".")[0]}\\s*[=:]`);
      if (exportPattern.test(content)) {
        return { exists: true, filePath: domainPath };
      }
    }
  }
  
  // Caso 2: api.X.Y (ex: api.activities.listActivities, api.packages.getAll)
  if (parts.length >= 2) {
    const module = parts[0];
    const functionName = parts.slice(1).join(".");
    
    // Verifica arquivo na raiz convex/ (ex: convex/activities.ts)
    const rootPath = path.join(CONVEX_DIR, `${module}.ts`);
    if (fs.existsSync(rootPath)) {
      const content = fs.readFileSync(rootPath, "utf-8");
      
      // Pode ser re-export de domains
      if (content.includes(`export * from "./domains/${module}"`)) {
        // Verifica no index do domínio
        const domainIndexPath = path.join(CONVEX_DIR, "domains", module, "index.ts");
        if (fs.existsSync(domainIndexPath)) {
          const indexContent = fs.readFileSync(domainIndexPath, "utf-8");
          if (indexContent.includes(functionName.split(".")[0])) {
            return { exists: true, filePath: domainIndexPath };
          }
        }
      }
      
      // Verifica se está definida diretamente no arquivo
      const exportPattern = new RegExp(`export (const|function) ${functionName.split(".")[0]}\\s*[=:]`);
      if (exportPattern.test(content)) {
        return { exists: true, filePath: rootPath };
      }
    }
  }
  
  return { exists: false };
}

console.log("🔍 Verificando chamadas de funções Convex...\n");

const calls = findConvexCalls(SRC_DIR);
console.log(`Encontradas ${calls.length} chamadas únicas de funções Convex\n`);

// Agrupar por caminho de API
const callsByPath = calls.reduce((acc, call) => {
  if (!acc[call.apiPath]) {
    acc[call.apiPath] = [];
  }
  acc[call.apiPath].push(call);
  return acc;
}, {} as Record<string, ConvexCall[]>);

const missing: string[] = [];
const found: string[] = [];

Object.entries(callsByPath).forEach(([apiPath, calls]) => {
  const result = checkConvexFunctionExists(apiPath);
  
  if (!result.exists) {
    missing.push(apiPath);
    console.log(`❌ api.${apiPath}`);
    console.log(`   Chamada em ${calls.length} arquivo(s):`);
    calls.slice(0, 3).forEach((call) => {
      console.log(`   - ${call.file}:${call.line}`);
    });
    if (calls.length > 3) {
      console.log(`   ... e mais ${calls.length - 3} arquivo(s)`);
    }
    console.log();
  } else {
    found.push(apiPath);
  }
});

console.log("\n" + "=".repeat(80));
console.log(`\n✅ Encontradas: ${found.length} funções`);
console.log(`❌ Faltando: ${missing.length} funções\n`);

if (missing.length > 0) {
  console.log("⚠️  Funções que precisam ser criadas:");
  missing.forEach((path) => console.log(`   - api.${path}`));
  console.log();
  process.exit(1);
} else {
  console.log("🎉 Todas as funções Convex chamadas existem!\n");
  process.exit(0);
}
