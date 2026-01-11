# This code generates and plots the impulse response of a  system defined by its equation.
import numpy as np
import matplotlib.pyplot as plt

# Define the impulse response function
def impulse_response(t):
    if t == 0:
        return 1
    else:
        return 0.5 ** t
    
# Generate Transfer function
s = np.poly1d([1, 0])
H_s = (5*s+3)/((s+1)*(s+2)*(s+3))

# Impulse response of H_s
y_t = np.polyder(H_s)
num_zeros = len(y_t.roots)
num_poles = len(H_s.roots)

