// Run locally as the library owner. Passwords are written only outside this repo.
// node scripts/issue-teacher-account.mjs LOGIN 'Full name' PRIVATE_OUTPUT_DIRECTORY
import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcryptjs';
import {randomBytes} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());
const [rawLogin,name,output]=process.argv.slice(2);
const username=(rawLogin||'').trim().toLowerCase();
if(!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(username)||!name?.trim()||name.length>120||!output)throw new Error('Usage: LOGIN NAME PRIVATE_OUTPUT_DIRECTORY');
const directory=path.resolve(output),repo=path.resolve('..');
await fs.mkdir(directory,{recursive:true});
const realDirectory=await fs.realpath(directory),realRepo=await fs.realpath(repo);
const relative=path.relative(realRepo,realDirectory);
if(!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative))throw new Error('Credentials must be stored outside the repository');
const credentialsFile=path.join(realDirectory,username+'.json');
const textFile=path.join(realDirectory,username+'.txt');
const db=new PrismaClient();
let createdFile=false,createdText=false;
try{
 if(await db.user.findUnique({where:{username}}))throw new Error('Username already exists; no password or access was changed');
 const password=randomBytes(15).toString('base64url');
 const credentials={name:name.trim(),username,password,status:'prepared_for_launch',access:'all_library_materials_forever'};
 await fs.writeFile(credentialsFile,JSON.stringify(credentials,null,2)+'\n',{flag:'wx',mode:0o600});createdFile=true;
 await fs.writeFile(textFile,`НЕУМОШКА · БИБЛИОТЕКА ДЛЯ УЧИТЕЛЕЙ\n\n${name.trim()}\nЛогин: ${username}\nПароль: ${password}\n\nБесплатный бессрочный доступ ко всем материалам, включая новые комплекты.\nАккаунт подготовлен к запуску. Публичный вход пока не открыт.\nАдрес входа будет выдан после запуска библиотеки.\n\nХраните этот файл у себя и передайте данные только владельцу аккаунта.\n`,{flag:'wx',mode:0o600});createdText=true;
 await db.user.create({data:{username,name:name.trim(),passwordHash:await bcrypt.hash(password,12),role:'user',status:'active',libraryAccessForever:true}});
 console.log(JSON.stringify({username,role:'user',libraryAccessForever:true,credentialsFile:textFile}));
}catch(error){
 if(createdFile)await fs.unlink(credentialsFile);
 if(createdText)await fs.unlink(textFile);
 throw error;
}finally{await db.$disconnect();}
