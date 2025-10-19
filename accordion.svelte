<script>
	import { Accordion as AccordionPrimitive } from "bits-ui";

	let {
		ref = $bindable(null),
		value = $bindable(),
		type = /** @type {"single" | "multiple"} */ ("single"),
		...restProps
	} = $props();
</script>

<AccordionPrimitive.Root
	bind:ref
	bind:value={value}
	type={type}
	data-slot="accordion"
	{...restProps}
/>
