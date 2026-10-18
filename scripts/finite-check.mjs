import { spawn } from 'node:child_process';
const [seconds,script,...args]=process.argv.slice(2);
const child=spawn(process.execPath,[script,...args],{stdio:'inherit'});
const timer=setTimeout(()=>{console.error(`Check exceeded ${seconds}s`);child.kill();process.exitCode=1;},Number(seconds)*1000);
child.on('exit',code=>{clearTimeout(timer);process.exitCode=code??1;});
