from datasets import load_dataset

dataset = load_dataset(
    "pszemraj/scientific_lay_summarisation-plos-norm",
    split="train[:1]"
)

print(dataset.column_names)

print(dataset[0])