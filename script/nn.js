//<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.1.0/dist/tf.min.js"></script>
class NeuralNetwork {
  //this how many inputs, hidden, and output nodes there are. modelC is the brain that we want to copy to give to the new bird
  constructor(inputNumber, hiddenNumber, outputNumber, modelC) {
    if (modelC instanceof tf.Sequential) {
      //this is the making a copy of the neural network
      this.input_nodes = inputNumber;
      this.hidden_nodes = hiddenNumber;
      this.output_nodes = outputNumber;
      this.model = modelC;
    } else {
      //this is the creating a random brain
      this.input_nodes = inputNumber;
      this.hidden_nodes = hiddenNumber;
      this.output_nodes = outputNumber;
      this.model = this.createBrain();
    }

    this.changeColor = false;
  }

  createBrain() {
    //the model is the neural network
    const model = tf.sequential();
    //configuring the hidden layer
    const hiddenLayer = tf.layers.dense({
      units: this.hidden_nodes,
      inputShape: [this.input_nodes],
      activaation: "sigmoid"
    });
    //configuring the output layer
    const outputLayer = tf.layers.dense({
      units: this.output_nodes,
      activaation: "sigmoid"
    });
    //adding the hidden layer to the model
    model.add(hiddenLayer);
    //adding the output layer to the model
    model.add(outputLayer);
    //returning the model
    return model;
  }

  predict(inputs) {
    //clearing the tensors after using them
    //then returning the output
    return tf.tidy(() => {
      //creating a tensor with the inputs
      const xs = tf.tensor2d([inputs]);
      //running the inputs through the neural network
      const ys = this.model.predict(xs);
      //getting the raw numbers from the tensor object
      const outputs = ys.dataSync();
      //returning the outputs
      return outputs;
    });
  }

  copy() {
    //clearing the tensors after using them
    //then returning the output
    return tf.tidy(() => {
      //creating a new neural network
      const modelCopy = this.createBrain();
      //getting the weights from the old neural network
      const weights = this.model.getWeights();
      //setting the new weights
      modelCopy.setWeights(weights);
      //making a new network but this time with all the weights then returning it
      return new NeuralNetwork(
        this.input_nodes,
        this.hidden_nodes,
        this.output_nodes,
        modelCopy
      );
    });
  }

  mutate(rate, colorGene) {
    //clearing the tensors after using them
    tf.tidy(() => {
      this.changeColor = false;
      //getting the weights so that we can change them later
      const weights = this.model.getWeights();
      //the variable that will be holding the mutated weights
      const mutatedWeights = [];
      for (let i = 0; i < weights.length; i++) {
        //getting the shape of the current weights
        let shape = weights[i].shape;
        //making a copy of the raw numbers from the object tensor
        //dataSync gets the numbers, but doesn't make a copy, so slice will make the copy
        let values = weights[i].dataSync().slice();
        for (let j = 0; j < values.length; j++) {
          //if the random number is less than mutation rate the it runs the code
          if (random(1) < rate) {
            this.changeColor = true;
            //mutating the value
            //randomGaussianis returns a float from a series of numbers with a mean of 0
            values[j] = values[j] + randomGaussian();
          }
        }
        //holding the new value of each weight
        mutatedWeights[i] = tf.tensor(values, shape);
      }
      //setting the mutated weights as the new weights
      this.model.setWeights(mutatedWeights);
    });
  }

  mutated() {
    if (this.changeColor) {
      this.changeColor = false;
      return true;
    } else {
      this.changeColor = false;
      return false;
    }
  }

  dispose() {
    //disposing the brain so that memory doesn't leak
    this.model.dispose();
  }
}
