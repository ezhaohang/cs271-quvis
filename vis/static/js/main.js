const FILE_VERSION = 1;
const Gate = require("./gate");
const Application = require("./application");
const examples = require("./examples");
let data = [];
const main = module.exports;

const displayAmplitudes = (nqubits, amplitudes) => {
    const hideBtn = document.querySelector("#hide-impossible");
    const hide = hideBtn.innerHTML !== "Hide Impossible States";
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
            if (hide) {
                continue;
            } else {
                row.style.color = "#ccc";
            }
        }
        const probability = (prob * 100).toFixed(4);
        row.innerHTML = `
            <td>|${state}></td>
            <td style="text-indent: 20px">${probability}</td>
        `;
        table.appendChild(row);
        data.push({
            state: state,
            probability: probability,
        });
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
                return d.state;
            } else {
                return "";
            }
        })
    );
    y.domain([0, 100]);

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

    const nqubitsUl = document.querySelector("#nqubits");
    const qubit_number = document.querySelector("#qubit-number");
    for (let i = 1; i < 3; i++) {
        const a = document.createElement("a");
        a.href = "#";
        a.innerHTML = '<img src="/static/images/delete.svg" />';
        a.onclick = (evt) => {
            evt.preventDefault();
            if (resize(i)) {
                nqubitsUl.removeChild(nqubitsUl.lastChild);
                qubit_number.removeChild(qubit_number.lastChild);
            }
        };
        a.className = "delete-icon container";
        nqubitsUl.appendChild(a);
        const div = document.createElement("div");
        div.innerHTML = "<p>qubit " + i + "</p>";
        div.className = "qubit-tag container";
        qubit_number.appendChild(div);
    }

    const hideBtn = document.querySelector("#hide-impossible");
    hideBtn.onclick = (evt) => {
        evt.preventDefault();
        const hide = "Hide Impossible States";
        const show = "Show All States";
        hideBtn.innerHTML = hideBtn.innerHTML == hide ? show : hide;
        document.querySelector("#evaluate").click();
    };

    document.querySelector("#reset").onclick = (evt) => {
        evt.preventDefault();
        const ok = confirm("Clear entire circuit?");
        if (ok) {
            app.circuit.gates = [];
            editor.render();
        }
    };

    document.querySelector("#add-qubit").onclick = (evt) => {
        evt.preventDefault();
        const last_qubit = app.circuit.nqubits + 1;
        editor.resize(app.circuit.nqubits + 1, editor.length);
        const nqubitsUl = document.querySelector("#nqubits");
        const qubit_number = document.querySelector("#qubit-number");
        const a = document.createElement("a");
        a.href = "#";
        a.innerHTML = '<img src="/static/images/delete.svg" />';
        a.onclick = (evt) => {
            evt.preventDefault();
            if (resize(last_qubit)) {
                nqubitsUl.removeChild(nqubitsUl.lastChild);
                qubit_number.removeChild(qubit_number.lastChild);
            }
        };
        a.className = "delete-icon container";
        nqubitsUl.appendChild(a);

        const div = document.createElement("div");
        div.innerHTML = "<p>qubit " + app.circuit.nqubits + "</p>";
        div.className = "qubit-tag container";
        qubit_number.appendChild(div);
    };

    document.querySelector("#myRange").onchange = (evt) => {
        evt.preventDefault();
        var slider = document.getElementById("myRange");
        const cur_time = Math.ceil(slider.value / 3);
        document.querySelector("#time").innerHTML = "time " + cur_time;
        document.querySelector("#state-header").innerHTML =
            "State Probabilities at Time " + cur_time;
        document.querySelector("#evaluate").click();
    };

    document.querySelector("#evaluate").onclick = (evt) => {
        var slider = document.getElementById("myRange");

        evt.preventDefault();
        app.circuit.gates.sort((a, b) => a.time - b.time);
        const size = Math.pow(2, app.circuit.nqubits);
        const amplitudes = new numeric.T(
            numeric.rep([size], 0),
            numeric.rep([size], 0)
        );
        const state = editor.input.join("");
        amplitudes.x[parseInt(state, 2)] = 1;
        app.applyCircuit(
            app.circuit.copy_until_time(slider.value),
            amplitudes,
            (amplitudes) => {
                displayAmplitudes(
                    app.circuit.nqubits,
                    amplitudes.div(amplitudes.norm2())
                );
            }
        );
    };

    document.body.onkeydown = (evt) => {
        // Catch hotkeys
        if (evt.which == 13) {
            evt.preventDefault();
            document.querySelector("#evaluate").click();
        }
    };

    const resize = (qubit_number) => {
        if (app.circuit.nqubits == 0 || app.circuit.nqubits < qubit_number) {
            return 0;
        }
        --qubit_number;
        const newGates = app.circuit.gates.filter((gate) => {
            let all_qubits = gate.controls.concat(gate.range, gate.targets);
            if (all_qubits.indexOf(qubit_number) == 0) {
                return false;
            } else {
                return true;
            }
        });

        newGates.map((gate) => {
            for (let i = 0; i < gate.controls.length; i++) {
                if (gate.controls[i] > qubit_number) {
                    --gate.controls[i];
                }
            }
            for (let i = 0; i < gate.range.length; i++) {
                if (gate.range[i] > qubit_number) {
                    --gate.range[i];
                }
            }
            for (let i = 0; i < gate.targets.length; i++) {
                if (gate.targets[i] > qubit_number) {
                    --gate.targets[i];
                }
            }
        });
        app.circuit.gates = newGates;
        editor.resize(app.circuit.nqubits - 1, editor.length);
        return 1;
    };

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

    document.querySelector("#canvas").onmouseleave = (evt) => {
        evt.preventDefault();
        document.querySelector("#evaluate").click();
        console.log("leave");
    };

    document.getElementById("evaluate").click();
    main.calculate_gate_prob = (input_gate) => {
        const new_circuit = app.circuit.copy();
        const new_gates = new_circuit.gates.filter((gate) => {
            let all_qubits = gate.controls.concat(gate.range, gate.targets);
            if (all_qubits.indexOf(input_gate.targets[0]) >= 0) {
                return true;
            } else {
                return false;
            }
        });
        const mapped_gates = [];
        for (let i = 0; i < new_gates.length; i++) {
            let new_targets = [];
            var num_targets = new_gates[i].targets.length;
            for (let i = 0; i < num_targets; i++) {
                new_targets.push(0);
            }
            let new_controls = [];
            var num_controls = new_gates[i].controls.length;

            for (let i = 0; i < num_controls; i++) {
                new_controls.push(0);
            }
            mapped_gates.push(
                new Gate(
                    new_gates[i].type,
                    new_gates[i].time,
                    new_targets,
                    new_controls
                )
            );
        }
        new_circuit.gates = mapped_gates;
        new_circuit.nqubits = 1;
        new_circuit.gates.sort((a, b) => a.time - b.time);
        const size = Math.pow(2, new_circuit.nqubits);
        const amplitudes = new numeric.T(
            numeric.rep([size], 0),
            numeric.rep([size], 0)
        );
        const state = new_circuit.app.editor.input.join("");
        amplitudes.x[parseInt(state, 2)] = 1;

        app.applyCircuit(
            new_circuit.copy_until_time(input_gate.time),
            amplitudes,
            (amplitudes) => {
                amplitudes = amplitudes.div(amplitudes.norm2());
                let prob = Math.pow(amplitudes.x[0], 2);
                prob += Math.pow(amplitudes.y[0], 2);
                input_gate.probability = prob * 100;
            }
        );
    };
};
