/*
Rendering primatives for circuit grid
*/
module.exports = class Draw {
    constructor(canvas, nqubits, length) {
        this.canvas = canvas;
        this.gfx = new Processing(canvas);
        this.nqubits = nqubits;
        this.length = length;
        this.gfx.textFont(
            this.gfx.loadFont("../fonts/RobotoCondensed-Regular.ttf")
        );
        this.gfx.textAlign(this.gfx.CENTER);
        this.gfx.size(length * 50, nqubits * 50);
    }

    resize(nqubits, length) {
        this.nqubits = nqubits;
        this.length = length;
        this.gfx.size(length * 50, nqubits * 50);
    }

    clear() {
        this.gfx.background(246, 252, 255);
        for (let i = 0; i < this.nqubits; i++) {
            this.gfx.line(0, i * 50 + 25, this.length * 50, i * 50 + 25);
        }
    }

    selection(x, qubits, r, g, b, a) {
        this.gfx.noStroke();
        this.gfx.fill(r, g, b, a);
        for (let i = 0; i < qubits.length; i++) {
            this.gfx.rect(x, qubits[i] * 50, 50, 50);
        }
        this.gfx.fill(255);
        this.gfx.stroke(0);
    }

    bar(x, y, p) {
        const width1 = p;
        const width2 = 100 - p;
        this.gfx.fill(56, 111, 164);
        this.gfx.rect(x, y, width1, 15);
        this.gfx.fill(132, 210, 246);
        this.gfx.rect(x + width1, y, width2, 15);
    }

    empty_gate(x, y) {
        this.gfx.stroke(19, 60, 85);
        this.gfx.strokeWeight(2);
        this.gfx.fill(225, 236, 239);
        this.gfx.rect(x + 2, y + 2, 46, 46, 5);
    }

    qubit(x, y, h, state) {
        this.gfx.textSize(17);
        this.gfx.noStroke();
        this.gfx.fill(246, 252, 255);
        this.gfx.rect(x - 20, y - 10, 50, h * 50 - 6);
        this.gfx.fill(0);
        this.gfx.text(state ? "|1>" : "|0>", x, y + (h / 2) * 50 - 15);
        this.gfx.fill(246, 252, 255);
        this.gfx.stroke();
        this.gfx.textSize(11);
    }

    gate(x, y, h, text) {
        this.gfx.fill(19, 60, 85);
        this.gfx.rect(x - 17, y - 17, 50 - 6, h * 50 - 6, 5);
        this.gfx.fill(246, 252, 255);
        this.gfx.textSize(18);
        this.gfx.textAlign(this.gfx.CENTER, this.gfx.CENTER);
        this.gfx.text(text, x + 6, y + (h / 2) * 50 - 21);
        this.gfx.fill(19, 60, 85);
    }

    swap(x, y) {
        this.gfx.stroke(19, 60, 85);
        this.gfx.line(x, y, x + 10, y + 10);
        this.gfx.line(x, y + 10, x + 10, y);
    }

    not(x, y) {
        this.gfx.fill(19, 60, 85);
        this.gfx.ellipse(x + 5, y + 5, 20, 20);
        this.gfx.stroke(246, 252, 255);
        this.gfx.line(x - 6, y + 5, x + 14, y + 5);
        this.gfx.line(x + 5, y - 6, x + 5, y + 14);
        this.gfx.stroke(19, 60, 85);
    }

    wire(x, y1, y2) {
        this.gfx.line(x, y1, x, y2);
    }

    control(x, y) {
        this.gfx.fill(19, 60, 85);
        this.gfx.ellipse(x + 5, y + 5, 10, 10);
    }
};
