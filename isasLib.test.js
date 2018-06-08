const isasLib = require("./isasLib");
const { expect } = require("chai");

require("dotenv").load();

describe("iSAS Lib", function () {
    this.slow(5000);

    it("should log in and get and parse prubezna klasifikace", async () => {
        const auth = [process.env["ISAS_USERNAME"], process.env["ISAS_PASSWORD"]];
        if (!auth || auth.some((d) => d == undefined)) {
            throw "No user/pass specified in ENV vars";
        }

        // @ts-ignore
        const znamky = await isasLib(...auth);

        expect(znamky.length).to.be.at.least(1); /* Might fail on start of year */
        expect(znamky).to.satisfy((znamkyArray) => {
            return znamkyArray.every((znamka) => {
                return expect(znamka.datum).to.be.a("string")
                    && expect(znamka.datum.length).to.be.at.least(5)
                    && expect(znamka.vaha).to.be.a("number")
                    && expect(znamka.znamka).to.be.oneOf(["1", "2", "3", "4", "5", "A", "N"])
                    && expect(znamka.predmet).to.be.a("string");
            });
        });
    });

    it("should return no marks when login failed", async () => {
        const auth = ["DFDF", "asdfsdf"];
        // @ts-ignore
        const znamky = await isasLib(...auth);

        expect(znamky.length).to.equal(0);
    });
});
