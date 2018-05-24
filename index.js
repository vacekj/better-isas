const express = require("express");
const app = express();
const bodyparser = require("body-parser");
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("./icons", {}));

const parser = require("./isasLib");
const base = require("./views/base");
const index = require("./views/index");

app.get("/", (req, res) => {
    res.send(
        base(
            index()
        )
    );
});

function prumery(znamky) {
    const predmety = Array.from(new Set(znamky.map((znamka) => znamka.predmet)));
    const result = predmety.map((predmet) => {
        const znamkyZPredmetu = znamky
            .filter((znamka) => znamka.predmet === predmet);
        const vazenySoucet = znamkyZPredmetu
            .reduce((soucet, curr) => {
                return soucet + curr.znamka * curr.vaha;
            }, 0);

        const soucetVah = znamkyZPredmetu
            .reduce((soucet, curr) => {
                return soucet + curr.vaha;
            }, 0);

        const vazenyPrumer = vazenySoucet / soucetVah;
        return {
            vazenyPrumer: Number(vazenyPrumer.toFixed(2)),
            predmet
        };
    });

    return result;
}

function isVyznamenani(znamky) {
    const averages = prumery(znamky).map((vazenyPrumer) => {
        return { ...vazenyPrumer, vyslednaZnamka: Math.round(vazenyPrumer.vazenyPrumer) };
    }).sort((a, b) => a.vazenyPrumer - b.vazenyPrumer);
    const numberOf2s = averages.filter((avg) => avg.vyslednaZnamka === 2).length;
    const numberOf1s = averages.filter((avg) => avg.vyslednaZnamka === 2).length;
    return averages.every((avg) => avg.vyslednaZnamka <= 2) && numberOf1s > numberOf2s;
}

const interpolate = require("color-interpolate");

app.post("/stats", async (req, res) => {
    const znamky = await parser(req.body.username, req.body.password);
    const vazenePrumery = prumery(znamky).map((vazenyPrumer) => {
        return { ...vazenyPrumer, vyslednaZnamka: Math.round(vazenyPrumer.vazenyPrumer) };
    }).sort((a, b) => a.vazenyPrumer - b.vazenyPrumer);

    /* Represent a prumer with color ranging from white for 1 to red for 5 */
    const prumerToRgb = (prumer) => {
        return interpolate(["white", "red"])((prumer - 1) / 4);
    };

    const prumeryRows = vazenePrumery
        .map((prumer) => `<tr>
    <td>${prumer.predmet}</td>
    <td style="border-right: solid 3px ${prumerToRgb(prumer.vazenyPrumer)}">${prumer.vazenyPrumer}</td>
    <td style="border-right: solid 3px ${prumerToRgb(prumer.vyslednaZnamka)}">${prumer.vyslednaZnamka}</td>
</tr>`)
        .join("");

    const znamkyRows = znamky
        .map((znamka) => `<tr>
    <td>${znamka.datum}</td>
    <td>${znamka.predmet}</td>
    <td>${znamka.znamka}</td>
    <td>${znamka.vaha}</td>
    <td>${znamka.tema}</td>
</tr>`)
        .join("");

    const template = base(
        require("./views/stats")(znamkyRows, prumeryRows, isVyznamenani(znamky)),
        require("./views/ads")()
    );

    res.send(template);
});

// Redirect the user to root when attempting to GET /stats
app.get("/stats", (req, res) => {
    res.redirect("/");
});

// Start the server
app.listen(80, () => console.log("Better-iSAS server listening on port 80"));