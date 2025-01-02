class Matrix {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.data = Array.from({ length: rows }, () => Array(cols).fill(0));
  }

  static fromArray(arr) {
    return new Matrix(arr.length, 1).map((_, i) => arr[i]);
  }

  toArray() {
    return this.data.flat();
  }

  static multiply(a, b) {
    if (a.cols !== b.rows) {
      console.error('Columns of A must match rows of B.');
      return null;
    }
    return new Matrix(a.rows, b.cols).map((_, i, j) => {
      let sum = 0;
      for (let k = 0; k < a.cols; k++) {
        sum += a.data[i][k] * b.data[k][j];
      }
      return sum;
    });
  }

  multiply(n) {
    return this.map((e, i, j) => e * n);
  }

  add(n) {
    if (n instanceof Matrix) {
      if (this.rows !== n.rows || this.cols !== n.cols) {
        console.error('Matrices must have the same dimensions.');
        return;
      }
      return this.map((e, i, j) => e + n.data[i][j]);
    } else {
      return this.map(e => e + n);
    }
  }

  static crossover(a, b) {
    let child = new Matrix(a.rows, a.cols);
    for (let i = 0; i < a.rows; i++) {
      for (let j = 0; j < a.cols; j++) {
        child.data[i][j] = Math.random() > 0.5 ? a.data[i][j] : b.data[i][j];
      }
    }
    return child;
  }

  mutate(rate) {
    return this.map(e => (Math.random() < rate ? e + Math.random() * 0.1 - 0.05 : e));
  }

  map(func) {
    this.data = this.data.map((row, i) => row.map((val, j) => func(val, i, j)));
    return this;
  }

  static map(matrix, func) {
    return new Matrix(matrix.rows, matrix.cols).map((_, i, j) => func(matrix.data[i][j], i, j));
  }

  randomize() {
    return this.map(() => Math.random() * 2 - 1);
  }

  static deserialize(data) {
    let matrix = new Matrix(data.rows, data.cols);
    matrix.data = data.data;
    return matrix;
  }
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function dsigmoid(y) {
  return y * (1 - y);
}