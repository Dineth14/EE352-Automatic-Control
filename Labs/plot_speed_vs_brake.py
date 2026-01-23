import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Set font directly to avoid cache issues
plt.rcParams['font.family'] = 'serif'
plt.rcParams['font.serif'] = ['Times New Roman'] + plt.rcParams['font.serif']
plt.rcParams['font.size'] = 14

# Data from Table 2 (Gain = 1)
brake_settings = [1, 2, 3, 4, 5, 6, 7]
speed_gain1_no_fb = [49.4, 47.5, 44.0, 38.2, 34.3, 31.5, 29.3]
speed_gain1_with_fb = [68.7, 64.4, 57.2, 44.8, 36.4, 33.0, 29.6]

# Data from Table 3 (Gain = 10)
speed_gain10_no_fb = [69.7, 63.6, 55.5, 43.3, 34.5, 30.3, 29.6]
speed_gain10_with_fb = [68.0, 60.6, 46.9, 40.3, 33.3, 30.1, 29.0]

def plot_graph(speed_no_fb, speed_with_fb, gain_val, output_filename):
    # A4 Portrait Size (in inches)
    fig, ax = plt.subplots(figsize=(8.27, 11.69))

    # Plot Speed Without Velocity Feedback
    ax.plot(brake_settings, speed_no_fb, color='k', marker='o', linestyle='-', linewidth=2, markersize=8, label='Without Velocity Feedback')

    # Plot Speed With Velocity Feedback
    ax.plot(brake_settings, speed_with_fb, color='k', marker='s', linestyle='-', linewidth=2, markersize=8, label='With Velocity Feedback')

    # Hide the top and right spines
    ax.spines['right'].set_visible(False)
    ax.spines['top'].set_visible(False)

    # Set limits
    ax.set_ylim(bottom=0, top=80)
    ax.set_xlim(left=0, right=8)

    # Remove standard labels to replace with custom ones
    ax.set_xlabel('')
    ax.set_ylabel('')

    # Custom X-axis label (Bottom Right)
    ax.text(1.0, -0.05, "Brake Setting", ha='right', va='top', transform=ax.transAxes, fontsize=16)

    # Custom Y-axis label (Top Left, Vertical)
    # Positioning "Speed (rpm)" at the top of the Y-axis
    ax.text(-0.05, 1.00, "Speed (rpm)", ha='right', va='center', rotation=90, transform=ax.transAxes, fontsize=16)
    
    # Add legend
    ax.legend(frameon=True, loc='upper right', fontsize=14)

    # Add grid (optional, keeping it subtle)
    ax.grid(True, linestyle=':', alpha=0.6)

    # Save the plot
    plt.savefig(output_filename, dpi=300, bbox_inches='tight')
    print(f"Plot saved to {output_filename}")
    plt.close()

# Generate Plot for Gain = 1
plot_graph(speed_gain1_no_fb, speed_gain1_with_fb, 1, 'Speed_vs_Brake_Gain1.png')

# Generate Plot for Gain = 10
plot_graph(speed_gain10_no_fb, speed_gain10_with_fb, 10, 'Speed_vs_Brake_Gain10.png')
