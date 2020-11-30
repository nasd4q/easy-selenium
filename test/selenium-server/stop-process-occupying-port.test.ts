import * as child_process from 'child_process';
import { expect } from "chai";
import { SELENIUM_3, CHROMEDRIVER, GECKODRIVER} from '00_selenium-resources';

import { SeleniumServer } from "../..";

const JAR =  SELENIUM_3;

describe("If some selenium server is running", function() {
    it("_stopJavaProcessesOccupyingPort allows to kill underlying process", async ()=>{
        //Finding free port
        let PORT : number;
        do {
            PORT = Math.floor(Math.random()*61535) + 4000;
        } while (! await isFreePort(PORT));

        //console.log(`Chosen port : ${PORT}`)
        
        //Setting up a process to kill...
        let selenium = new SeleniumServer(PORT);
        expect(await selenium.isAlive()).to.equal(false);
        let up = await selenium.start(JAR,CHROMEDRIVER, GECKODRIVER, null);
        expect(up).to.equal(true);
        expect(await selenium.isAlive()).to.equal(true);
        expect(await isListeningPort(PORT)).to.equal(true);

        //Stoping the server
        let res = await SeleniumServer._stopJavaProcessesOccupyingPort(PORT);
        expect(res).to.equal(true);
        expect(await selenium.isAlive()).to.equal(false);
        expect(await isListeningPort(PORT)).to.equal(false);

        res = await SeleniumServer._stopJavaProcessesOccupyingPort(PORT);
        expect(res).to.equal(false);
    })
})

function isFreePort(port): Promise<boolean> {
    let cp = child_process.exec(`netstat -anvp tcp | awk '$4 ~ /\\.${port}/'`);
    return new Promise(res=>{
        cp.stdout.on("data", ()=>{ 
            res(false);
        })
        cp.on("exit",  ()=> {
            res(true);
        })
    });
}

function isListeningPort(port): Promise<boolean> {
    let cp = child_process.exec(`netstat -anvp tcp | awk '/LISTEN/ && $4 ~ /\\.${port}/'`);
    return new Promise(res=>{
        cp.stdout.on("data", ()=>{ 
            res(true);
        })
        cp.on("exit",  ()=> {
            res(false);
        })
    });
}