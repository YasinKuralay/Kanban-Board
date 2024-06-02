import type { Meta, StoryObj } from '@storybook/angular';
import { CheckboxComponent } from './checkbox.component';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
const meta: Meta<CheckboxComponent> = {
  title: 'UI/Checkbox',
  component: CheckboxComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ReactiveFormsModule], // Needed to be able to use FormControls in the stories
    }),
  ],
  render: (args: CheckboxComponent) => ({
    props: {
      backgroundColor: null,
      ...args,
    },
  }),
  argTypes: {
    // backgroundColor: {
    //   control: 'color',
    // },
  },
};

export default meta;
// type Story = StoryObj<CheckboxComponent>;

const Template: StoryObj<CheckboxComponent> = {
  render: (args: CheckboxComponent) => ({
    props: {
      ...args,
      // Bind the form control to your component's input
      control: args.control || new FormControl(false),
    },
  }),
};

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
// export const Primary: Story = {
//   args: {
//     // primary: true,
//     label: 'Button',
//   },
// };

export const Primary: StoryObj<CheckboxComponent> = {
  ...Template,
  args: {
    // Provide default arguments for the primary state
    label: 'Checkbox',
    control: new FormControl(false), // You can set default checked state here
  },
};

// export const Secondary: Story = {
//   args: {
//     label: 'Button',
//   },
// };

// export const Large: Story = {
//   args: {
//     // size: 'large',
//     label: 'Button',
//   },
// };

// export const Small: Story = {
//   args: {
//     // size: 'small',
//     label: 'Button',
//   },
// };
