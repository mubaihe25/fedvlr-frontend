export interface TrainConfig {
  dataset: string;
  model: string;
  mode: string;
  learningRate: number;
  epochs: number;
  clientCount: number;
  attackTypes: string[];
  poisoningRatio: number;
}
