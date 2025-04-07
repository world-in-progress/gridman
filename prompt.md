# Prompt: Generate ICRM Interface from CRM Implementation

## Task Description
Generate the interface (ICRM) file based on the provided Core Resource Model (CRM) implementation. The ICRM should include all necessary class declarations, interface methods, and serialization/deserialization functions that match the CRM implementation.

## Context
In our architecture:
- **CRM (Core Resource Model)**: Contains the actual implementation of functionality
- **ICRM (Interface for Core Resource Model)**: Defines the interface and serialization methods

These need to stay synchronized, with the ICRM properly reflecting all methods decorated with `@cc.transfer` in the CRM.

## Input Format
I will provide a CRM implementation file. This file contains a class implementing specific functionality with methods that are decorated with `@cc.transfer` annotations specifying input_name and output_name parameters.

## Output Requirements

1. **Class Declarations**:
   - Extract and declare any complex classes used as parameters or return types in the interface (similar to `GridAttribute` and `GridSchema`)
   - Include proper type hints and docstrings

2. **Interface Class**:
   - Create an interface class that matches the CRM class
   - **IMPORTANT**: Do NOT include an `__init__` method in the interface class
   - Include all methods decorated with `@cc.transfer` in the CRM
   - Preserve the method signatures, docstrings, and decorator parameters
   - Set direction attribute to '->' (component side direction) as a class variable

3. **Serialization/Deserialization Functions**:
   - **MANDATORY**: Create serialization/deserialization functions for EVERY SINGLE `input_name` and `output_name` in the `@cc.transfer` decorators
   - **CRITICAL**: BOTH serialization AND deserialization functions MUST be implemented for ALL types
   - **PROHIBITED**: Do NOT skip implementing any function with excuses like "No deserialization needed as it's only input" or "No serialization needed as it's only output"
   - For each unique `input_name` and `output_name`:
     - Create a serialization function that converts Python objects to bytes
     - Create a deserialization function that converts bytes back to Python objects
   - **CRUCIAL**: The inputs/outputs of serialization/deserialization functions MUST EXACTLY match the corresponding method parameters:
     - Serialization function parameters must exactly match the method inputs (don't combine them into tuples or other wrappers)
     - Deserialization function output must exactly match the method output structure
   - Follow the naming pattern: `serialize_X` and `deserialize_X` where X is the name from input_name/output_name
   - **IMPORTANT**: All serialization/deserialization functions MUST use PyArrow Tables as an intermediate format:
     - For serialization:
       1. Define a PyArrow schema for the data structure
       2. Convert Python objects to PyArrow-compatible format (dict, list, arrays)
       3. Create a PyArrow Table from the data
       4. Use `cc.message.serialize_from_table(table)` to convert to bytes
     - For deserialization:
       1. Use `cc.message.deserialize_to_rows()` or `cc.message.deserialize_to_table()` to convert bytes to PyArrow data
       2. Extract data from PyArrow format and convert back to Python objects

4. **Registration Code**:
   - **CRITICAL**: EVERY `register_wrapper` call MUST include BOTH a serialization function AND a deserialization function
   - **PROHIBITED**: NEVER use `None` or any other placeholder in place of a real function for either serializer or deserializer
   - **WRONG EXAMPLE**:
     ```python
     # THIS IS INCORRECT - DO NOT DO THIS:
     cc.message.register_wrapper('PeerGridInfos', serialize_peer_grid_infos, None)  # No deserialization needed as it's only input
     ```
   - **CORRECT EXAMPLE**:
     ```python
     # THIS IS CORRECT - ALWAYS DO THIS:
     cc.message.register_wrapper('PeerGridInfos', serialize_peer_grid_infos, deserialize_peer_grid_infos)
     ```
   - Generate registration code using `cc.message.register_wrapper` for all serialization/deserialization pairs
   - **IMPORTANT**: ALL serialization/deserialization function pairs MUST be registered, even if you think they are only used in one direction

5. **Type Annotations**:
   - Use modern Python type annotations (Python 3.9+) without importing from the `typing` module
   - Examples:
     - Use `list[int]` instead of `typing.List[int]`
     - Use `dict[str, int]` instead of `typing.Dict[str, int]`
     - Use `tuple[int, str]` instead of `typing.Tuple[int, str]`
     - Use Union types with pipe notation `str | None` instead of `typing.Optional[str]` or `typing.Union[str, None]`

## Example
For a method in CRM like:
```python
@cc.transfer(input_name='PeerGridInfos', output_name='GridAttributes')
def get_grid_infos(self, level: int, global_ids: list[int]) -> list[GridAttribute]:
    # implementation
```

The serialization/deserialization functions must be:
```python
# Input serialization - parameters match method input exactly
def serialize_peer_grid_infos(level: int, global_ids: list[int]) -> bytes:
    # implementation

# Output deserialization - returns exactly what the method returns
def deserialize_grid_attributes(arrow_bytes: bytes) -> list[GridAttribute]:
    # implementation
```

And registered like this:
```python
# BOTH functions must be provided:
cc.message.register_wrapper('PeerGridInfos', serialize_peer_grid_infos, deserialize_peer_grid_infos)
cc.message.register_wrapper('GridAttributes', serialize_grid_attributes, deserialize_grid_attributes)
```

## Serialization Example
```python
def serialize_grid_schema(schema: GridSchema) -> bytes:
    # Define PyArrow schema
    pa_schema = pa.schema([
        pa.field('epsg', pa.int32()),
        pa.field('bounds', pa.list_(pa.float64())),
        pa.field('first_size', pa.float64()),
        pa.field('subdivide_rules', pa.list_(pa.list_(pa.int32())))
    ])
    
    # Convert to PyArrow-compatible format
    data = {
        'epsg': schema.epsg,
        'bounds': schema.bounds,
        'first_size': schema.first_size,
        'subdivide_rules': schema.subdivide_rules
    }
    
    # Create PyArrow Table
    table = pa.Table.from_pylist([data], schema=pa_schema)
    
    # Serialize to bytes
    return cc.message.serialize_from_table(table)
```

## Important Notes
- Match the exact method signatures, including parameter names and type hints
- Preserve docstrings from the original methods
- Handle any imports needed for the interface
- Consider dependencies between classes and methods
- The interface class should NOT have an implementation of methods, only declarations
- All serialization MUST use PyArrow Tables as the intermediate format
- DO NOT combine parameters into tuples or other containers when creating serialization functions
- You MUST implement BOTH serialization AND deserialization functions for ALL input_name and output_name values
- You MUST implement all functions even if they seem redundant or unused
- You MUST provide BOTH serialization AND deserialization functions in EVERY register_wrapper call
- NEVER use None, null, or any placeholder in the registration code - always provide real functions
