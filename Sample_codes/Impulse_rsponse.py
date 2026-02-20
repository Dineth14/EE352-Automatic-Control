"""
Transient response of a generic second-order closed-loop system:

    T(s) = wn^2 / (s^2 + 2*zeta*wn*s + wn^2)

This script plots the unit-step response for:
1) Underdamped (zeta < 1)
2) Critically damped (zeta = 1)
3) Overdamped (zeta > 1)
"""

import numpy as np
import matplotlib.pyplot as plt


def step_response_second_order(t: np.ndarray, wn: float, zeta: float) -> np.ndarray:
    """Unit-step response for the generic second-order system."""
    if zeta < 1.0:
        wd = wn * np.sqrt(1.0 - zeta**2)
        phi = np.arctan(np.sqrt(1.0 - zeta**2) / zeta)
        y = 1.0 - (np.exp(-zeta * wn * t) / np.sqrt(1.0 - zeta**2)) * np.sin(wd * t + phi)
        return y

    if np.isclose(zeta, 1.0):
        y = 1.0 - np.exp(-wn * t) * (1.0 + wn * t)
        return y

    alpha = np.sqrt(zeta**2 - 1.0)
    s1 = -wn * (zeta - alpha)
    s2 = -wn * (zeta + alpha)
    y = 1.0 + (s2 * np.exp(s1 * t) - s1 * np.exp(s2 * t)) / (s1 - s2)
    return y


def main() -> None:
    wn = 5.0  # natural frequency (rad/s)
    t = np.linspace(0.0, 5.0, 1000)

    cases = [
        ("Underdamped (zeta = 0.3)", 0.3, "tab:blue"),
        ("Critically damped (zeta = 1.0)", 1.0, "tab:green"),
        ("Overdamped (zeta = 1.8)", 1.8, "tab:red"),
    ]

    plt.figure(figsize=(10, 6))
    for label, zeta, color in cases:
        y = step_response_second_order(t, wn, zeta)
        plt.plot(t, y, label=label, color=color, linewidth=2)

    plt.axhline(1.0, color="black", linestyle="--", linewidth=1, label="Final value")
    plt.title("Transient Step Response of Generic Second-Order System")
    plt.xlabel("Time (s)")
    plt.ylabel("Output y(t)")
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    main()

