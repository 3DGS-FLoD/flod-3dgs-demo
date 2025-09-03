#!/bin/bash

if [ $# -ne 3 ]; then
    echo "Usage: ./convert_directory_to_flod_ksplat.sh [input_directory] [output_directory] [scene_name]"
    exit 1
fi

INPUT_DIR="$1"
OUTPUT_DIR="$2"
SCENE_NAME="$3"
INPUT_DIR_WITH_POINT_CLOUD="$INPUT_DIR/point_cloud"

if [ ! -d "$INPUT_DIR_WITH_POINT_CLOUD" ]; then
    echo "Error: $INPUT_DIR_WITH_POINT_CLOUD not found"
    exit 1
fi

mkdir -p "$OUTPUT_DIR"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOD_DIRS=($(find "$INPUT_DIR_WITH_POINT_CLOUD" -maxdepth 1 -type d -name "lod_*" | sort))

if [ ${#LOD_DIRS[@]} -eq 0 ]; then
    echo "No LOD directories found"
    exit 1
fi

for lod_dir in "${LOD_DIRS[@]}"; do
    lod_level=$(echo "$lod_dir" | grep -o 'lod_[0-9]' | grep -o '[0-9]')
    [ -z "$lod_level" ] && echo "Skip: cannot parse level from $(basename "$lod_dir")" && continue

    ply_file="$lod_dir/point_cloud.ply"
    [ ! -f "$ply_file" ] && echo "Skip: no point_cloud.ply in $(basename "$lod_dir")" && continue

    if [ "$lod_level" -ge 1 ] && [ "$lod_level" -le 4 ]; then
        output_file="$OUTPUT_DIR/${SCENE_NAME}_level${lod_level}.ksplat"
        if node "$SCRIPT_DIR/create-ksplat-flod.js" "$ply_file" "$output_file" "$lod_level" 0 1; then
            echo "LOD $lod_level -> $(basename "$output_file")"
        else
            echo "LOD $lod_level -> error"
        fi
    elif [ "$lod_level" -eq 5 ]; then
        output_file="$OUTPUT_DIR/${SCENE_NAME}_level5.ksplat"
        if node "$SCRIPT_DIR/create-ksplat.js" "$ply_file" "$output_file" 0 1; then
            echo "LOD 5 -> $(basename "$output_file")"
        else
            echo "LOD 5 -> error"
        fi
    else
        echo "Skip: unknown level $lod_level"
    fi
done
