from utils.severity_classifier import classify_severity

print("Testing Started")

print("5.5 =", classify_severity(5.5))
print("7.2 =", classify_severity(7.2))
print("9.1 =", classify_severity(9.1))
print("11 =", classify_severity(11))
print("13 =", classify_severity(13))