class NeuralNetwork {
  constructor(inputNodes, hiddenNodes, outputNodes) {
    this.inputNodes = inputNodes;
    this.hiddenNodes = hiddenNodes;
    this.outputNodes = outputNodes;

    // Initializing weights and biases
    this.weightsIH = new Matrix(this.hiddenNodes, this.inputNodes).randomize();
    this.weightsHO = new Matrix(this.outputNodes, this.hiddenNodes).randomize();
    this.biasH = new Matrix(this.hiddenNodes, 1).randomize();
    this.biasO = new Matrix(this.outputNodes, 1).randomize();
  }

  predict(inputArray) {
    let inputs = Matrix.fromArray(inputArray);

    // Feedforward: Hidden layer
    let hidden = Matrix.multiply(this.weightsIH, inputs);
    hidden.add(this.biasH);
    hidden.map(sigmoid);

    // Feedforward: Output layer
    let output = Matrix.multiply(this.weightsHO, hidden);
    output.add(this.biasO);
    output.map(sigmoid);

    return output.toArray();
  }

  static crossover(parentA, parentB) {
    let child = new NeuralNetwork(
      parentA.inputNodes,
      parentA.hiddenNodes,
      parentA.outputNodes
    );

    // Crossover of weights and biases
    child.weightsIH = Matrix.crossover(parentA.weightsIH, parentB.weightsIH);
    child.weightsHO = Matrix.crossover(parentA.weightsHO, parentB.weightsHO);
    child.biasH = Matrix.crossover(parentA.biasH, parentB.biasH);
    child.biasO = Matrix.crossover(parentA.biasO, parentB.biasO);

    return child;
  }

  mutate(rate) {
    this.weightsIH.mutate(rate);
    this.weightsHO.mutate(rate);
    this.biasH.mutate(rate);
    this.biasO.mutate(rate);
  }

  serialize() {
    // Serialize the entire neural network into a JSON string
    return JSON.stringify({
      inputNodes: this.inputNodes,
      hiddenNodes: this.hiddenNodes,
      outputNodes: this.outputNodes,
      weightsIH: this.weightsIH,
      weightsHO: this.weightsHO,
      biasH: this.biasH,
      biasO: this.biasO
    });
  }

  static deserialize(data) {
    let jsonData = JSON.parse(data);
    let nn = new NeuralNetwork(
      jsonData.inputNodes,
      jsonData.hiddenNodes,
      jsonData.outputNodes
    );

    nn.weightsIH = Matrix.deserialize(jsonData.weightsIH);
    nn.weightsHO = Matrix.deserialize(jsonData.weightsHO);
    nn.biasH = Matrix.deserialize(jsonData.biasH);
    nn.biasO = Matrix.deserialize(jsonData.biasO);

    return nn;
  }
}