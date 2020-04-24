const FILE_VERSION = 1;

const Application = require("./application");
const examples = require("./examples");
let data = [];

const displayAmplitudes = (nqubits, amplitudes) => {
    const table = document.querySelector("#state-table");
    table.innerHTML = "";
    data = [];
    for (let i = 0; i < amplitudes.x.length; i++) {
        let amplitude = "";
        let state = "";
        for (let j = 0; j < nqubits; j++) {
            state = ((i & (1 << j)) >> j) + state;
        }
        amplitude += amplitudes.x[i].toFixed(8);
        amplitude += amplitudes.y[i] < 0 ? "-" : "+";
        amplitude += Math.abs(amplitudes.y[i]).toFixed(8) + "i";
        const row = document.createElement("tr");
        let prob = Math.pow(amplitudes.x[i], 2);
        prob += Math.pow(amplitudes.y[i], 2);
        if (prob < numeric.epsilon) {
            row.style.color = "#ccc";
        }
        const probability = (prob * 100).toFixed(4);
        row.innerHTML = `
            <td>|${state}></td>
            <td style="text-indent: 20px">${probability}</td>
        `;
        table.appendChild(row);
        data.push({ state: state, probability: probability });
    }

    d3.select("svg").selectAll("*").remove();
    var svg = d3
            .select("svg")
            .attr("width", 350)
            .attr("height", 350)
            .attr("font-family", "sans-serif")
            .attr("font-size", 14),
        width = +svg.attr("width"),
        height = +svg.attr("height"),
        innerRadius = 0,
        outerRadius = Math.min(width, height) / 2,
        g = svg
            .append("g")
            .attr(
                "transform",
                "translate(" + width / 2 + "," + height / 2 + ")"
            );

    var x = d3
        .scaleBand()
        .range([0, 2 * Math.PI])
        .align(0);

    var y = d3.scaleRadial().range([innerRadius, outerRadius]);

    var z = d3.scaleOrdinal().range(["#133c55"]);

    x.domain(
        data.map(function (d) {
            if (d) {
                console.log(d.state);
                return d.state;
            } else {
                return "";
            }
        })
    );
    y.domain([0, 100]);

    console.log(d3.stack().keys(["probability"])(data));
    g.append("g")
        .selectAll("g")
        .data(d3.stack().keys(["probability"])(data))
        .enter()
        .append("g")
        .attr("fill", function (d) {
            return z(d.key);
        })
        .selectAll("path")
        .data(function (d) {
            return d;
        })
        .enter()
        .append("path")
        .attr(
            "d",
            d3
                .arc()
                .innerRadius(function (d) {
                    return y(d[0]);
                })
                .outerRadius(function (d) {
                    return y(d[1]);
                })
                .startAngle(function (d) {
                    return x(d.data.state);
                })
                .endAngle(function (d) {
                    return x(d.data.state) + x.bandwidth();
                })
                .padAngle(0.01)
                .padRadius(innerRadius)
        );

    var label = g
        .append("g")
        .selectAll("g")
        .data(data)
        .enter()
        .append("g")
        .attr("text-anchor", "middle")
        .attr("transform", function (d) {
            return (
                "rotate(" +
                (((x(d.state) + x.bandwidth() / 2) * 180) / Math.PI - 90) +
                ")translate(" +
                (outerRadius + 40) +
                ",0)"
            );
        });

    label.append("line").attr("x2", -5).attr("stroke", "#000");

    label
        .append("text")
        .attr("transform", function (d) {
            return (x(d.state) + x.bandwidth() / 2 + Math.PI / 2) %
                (2 * Math.PI) <
                Math.PI
                ? "rotate(90)translate(0,16)"
                : "rotate(-90)translate(0,-9)";
        })
        .text(function (d) {
            return d.state;
        });

    var yAxis = g.append("g").attr("text-anchor", "middle");

    var yTick = yAxis
        .selectAll("g")
        .data(y.ticks(5).slice(1))
        .enter()
        .append("g");

    yTick
        .append("circle")
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("r", y);

    yTick
        .append("text")
        .attr("y", function (d) {
            return -y(d);
        })
        .attr("dy", "0.35em")
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-width", 5)
        .text(y.tickFormat(5, "s"));

    yTick
        .append("text")
        .attr("y", function (d) {
            return -y(d);
        })
        .attr("dy", "0.35em")
        .text(y.tickFormat(5, "s"));

    yAxis
        .append("text")
        .attr("y", function (d) {
            return -y(y.ticks(5).pop());
        })
        .attr("dy", "-1em");
};

window.onload = () => {
    document.querySelector("#toolbar").onselectstart = (evt) => false;
    const canvas = document.getElementById("canvas");
    const app = new Application(canvas, 2);
    const editor = app.editor;

    document.querySelector("#reset").onclick = (evt) => {
        evt.preventDefault();
        const ok = confirm("Clear entire circuit?");
        if (ok) {
            app.circuit.gates = [];
            editor.render();
        }
    };

    document.querySelector("#evaluate").onclick = (evt) => {
        evt.preventDefault();
        app.circuit.gates.sort((a, b) => a.time - b.time);
        const size = Math.pow(2, app.circuit.nqubits);
        const amplitudes = new numeric.T(
            numeric.rep([size], 0),
            numeric.rep([size], 0)
        );
        const state = editor.input.join("");
        amplitudes.x[parseInt(state, 2)] = 1;
        app.applyCircuit(app.circuit, amplitudes, (amplitudes) => {
            displayAmplitudes(
                app.circuit.nqubits,
                amplitudes.div(amplitudes.norm2())
            );
        });
    };

    document.body.onkeydown = (evt) => {
        // Catch hotkeys
        if (evt.which == "S".charCodeAt(0) && evt.ctrlKey) {
            evt.preventDefault();
            document.querySelector("#compile").click();
        } else if (evt.which == 13) {
            evt.preventDefault();
            document.querySelector("#evaluate").click();
        }
    };

    document.querySelector("#compile").onclick = (evt) => {
        evt.preventDefault();
        app.circuit.gates.sort((a, b) => a.time - b.time);
        const size = Math.pow(2, app.circuit.nqubits);
        const U = new numeric.T(
            numeric.identity(size),
            numeric.rep([size, size], 0)
        );
        app.applyCircuit(app.circuit, U, (U) => {
            const name = prompt("Name of gate:", "F");
            if (name) {
                if (app.workspace.gates[name]) {
                    app.workspace.gates[name].matrix = U;
                    app.workspace.gates[name].circuit = app.circuit.copy();
                    app.workspace.gates[name].nqubits = app.circuit.nqubits;
                    app.workspace.gates[name].input = app.editor.input;
                } else {
                    app.workspace.addGate({
                        name: name,
                        qubits: app.circuit.nqubits,
                        matrix: U,
                        circuit: app.circuit.copy(),
                        input: app.editor.input,
                    });
                }
            }
        });
    };

    document.querySelector("#exportImage").onclick = (evt) => {
        evt.preventDefault();
        const oldlength = editor.length;
        const times = app.circuit.gates.map((gate) => gate.time);
        editor.resize(app.circuit.nqubits, Math.max.apply(Math, times) + 1);
        window.open(editor.draw.canvas.toDataURL("image/png"));
        editor.resize(app.circuit.nqubits, oldlength);
    };

    document.querySelector("#exportMatrix").onclick = (evt) => {
        evt.preventDefault();
        app.circuit.gates.sort((a, b) => a.time - b.time);
        const size = Math.pow(2, app.circuit.nqubits);
        const U = new numeric.T(
            numeric.identity(size),
            numeric.rep([size, size], 0)
        );
        app.applyCircuit(app.circuit, U, (U) => {
            const child = window.open(
                "",
                "matrix.csv",
                ",resizable=yes,scrollbars=yes,menubar=yes,toolbar=yes,titlebar=yes,hotkeys=yes,status=1,dependent=no"
            );
            for (let i = 0; i < U.x.length; i++) {
                const row = [];
                for (let j = 0; j < U.x[i].length; j++) {
                    row.push(
                        U.x[i][j].toFixed(16) +
                            "+" +
                            U.y[i][j].toFixed(16) +
                            "i"
                    );
                }
                child.document.write(row.join(",") + "<br>");
            }
        });
    };

    document.querySelector("#importJSON").onclick = (evt) => {
        evt.preventDefault();
        const input = document.createElement("input");
        input.type = "file";
        input.onchange = (evt) => {
            const reader = new FileReader();
            reader.onloadend = (evt) => {
                if (evt.target.readyState !== FileReader.DONE) {
                    return;
                }
                app.loadWorkspace(JSON.parse(evt.target.result));
            };
            reader.readAsText(evt.target.files[0]);
        };
        input.click();
    };

    document.querySelector("#exportJSON").onclick = (evt) => {
        evt.preventDefault();
        const out = app.exportWorkspace();
        out.version = FILE_VERSION;
        const blob = new Blob([JSON.stringify(out)]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "workspace.json";
        a.click();
    };

    const resize = (size) => {
        document.querySelector("#nqubits > span").innerHTML = "Qubits: " + size;
        const newGates = app.circuit.gates.filter((gate) => {
            return gate.range[1] < size;
        });
        if (newGates.length < app.circuit.gates.length) {
            const count = app.circuit.gates.length - newGates.length;
            const ok = confirm(
                "Resizing will remove " + count + " gates. Resize anyway?"
            );
            if (ok) {
                app.circuit.gates = newGates;
                editor.resize(size, editor.length);
            }
        } else {
            editor.resize(size, editor.length);
        }
    };

    const nqubitsUl = document.querySelector("#nqubits > ul");
    for (let i = 1; i < 11; i++) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "#";
        a.innerHTML = i;
        a.onclick = (evt) => {
            evt.preventDefault();
            resize(i);
        };
        li.appendChild(a);
        nqubitsUl.appendChild(li);
        if (i == 2) {
            a.click();
        }
    }

    const getUrlVars = () => {
        const vars = [];
        const location = window.location.href;
        const hashes = location.slice(location.indexOf("?") + 1).split("&");
        for (let i = 0; i < hashes.length; i++) {
            const hash = hashes[i].split("=");
            vars.push(hash[0]);
            vars[hash[0]] = decodeURI(hash[1]);
        }
        return vars;
    };

    const EXAMPLES = [
        ["Toffoli", examples.TOFFOLI],
        ["Bell State", examples.BELL_STATE],
        ["2 Qubit QFT", examples.QFT2],
        ["4 Qubit QFT", examples.QFT4],
        ["Grover's Algorithm", examples.GROVERS_ALGORITHM],
        ["Quantum Teleportation", examples.TELEPORTATION],
    ];
    const examplesEl = document.querySelector("#examples");
    EXAMPLES.forEach((example, i) => {
        const name = example[0];
        const json = example[1];
        const a = document.createElement("a");
        a.href = "#";
        a.appendChild(document.createTextNode(name));
        a.onclick = (evt) => {
            evt.preventDefault();
            open("?example=" + example[0]);
        };
        if (getUrlVars().example == name) {
            app.loadWorkspace(json);
        }
        const li = document.createElement("li");
        li.appendChild(a);
        examplesEl.appendChild(li);
    });

    document.querySelector("#about").onclick = (evt) => {
        document.querySelector("#modal").style.display = "block";
    };

    document.querySelector("#modal").onclick = (evt) => {
        document.querySelector("#modal").style.display = "none";
    };

    document.querySelector("#modal > div").onclick = (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
    };
};
