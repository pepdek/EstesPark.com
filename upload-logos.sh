#!/bin/bash

# Automated Logo Upload Script for EstesPark.com
# Usage: ./upload-logos.sh [category] [source_directory]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGES_DIR="$SCRIPT_DIR/images"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to optimize images
optimize_image() {
    local file="$1"
    local output="$2"
    
    if command -v convert &> /dev/null; then
        # Use ImageMagick to optimize
        convert "$file" -resize "200x200>" -quality 85 "$output"
        print_status "Optimized: $(basename "$output")"
    elif command -v sips &> /dev/null; then
        # Use macOS sips as fallback
        sips -s format png -Z 200 "$file" --out "$output" &> /dev/null
        print_status "Optimized: $(basename "$output")"
    else
        # Just copy if no optimization tools available
        cp "$file" "$output"
        print_warning "Copied without optimization: $(basename "$output")"
    fi
}

# Function to process logos in a directory
process_logos() {
    local category="$1"
    local source_dir="$2"
    local target_dir="$IMAGES_DIR/$category"
    
    if [ ! -d "$source_dir" ]; then
        print_error "Source directory does not exist: $source_dir"
        return 1
    fi
    
    mkdir -p "$target_dir"
    print_status "Processing logos for category: $category"
    
    local count=0
    for file in "$source_dir"/*.{png,jpg,jpeg,svg,webp,PNG,JPG,JPEG,SVG,WEBP} 2>/dev/null; do
        [ -f "$file" ] || continue
        
        local filename=$(basename "$file")
        local name="${filename%.*}"
        local ext="${filename##*.}"
        
        # Convert filename to lowercase and replace spaces/special chars
        local clean_name=$(echo "$name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
        
        local output_file="$target_dir/$clean_name.$ext"
        
        optimize_image "$file" "$output_file"
        ((count++))
    done
    
    print_status "Processed $count logo(s) for $category"
}

# Function to auto-detect and organize logos
auto_organize() {
    local source_dir="$1"
    
    print_status "Auto-organizing logos from: $source_dir"
    
    # Create associative arrays for categorization
    declare -A lodging_keywords=( [hotel]=1 [inn]=1 [resort]=1 [lodge]=1 [cabin]=1 [cottage]=1 [motel]=1 )
    declare -A dining_keywords=( [restaurant]=1 [cafe]=1 [bar]=1 [grill]=1 [bistro]=1 [brewery]=1 [bakery]=1 [diner]=1 )
    declare -A attraction_keywords=( [park]=1 [museum]=1 [tour]=1 [adventure]=1 [recreation]=1 [activity]=1 )
    
    for file in "$source_dir"/*.{png,jpg,jpeg,svg,webp,PNG,JPG,JPEG,SVG,WEBP} 2>/dev/null; do
        [ -f "$file" ] || continue
        
        local filename=$(basename "$file" | tr '[:upper:]' '[:lower:]')
        local category="general"
        
        # Categorize based on filename
        for keyword in "${!lodging_keywords[@]}"; do
            if [[ "$filename" == *"$keyword"* ]]; then
                category="lodging"
                break
            fi
        done
        
        if [ "$category" = "general" ]; then
            for keyword in "${!dining_keywords[@]}"; do
                if [[ "$filename" == *"$keyword"* ]]; then
                    category="dining"
                    break
                fi
            done
        fi
        
        if [ "$category" = "general" ]; then
            for keyword in "${!attraction_keywords[@]}"; do
                if [[ "$filename" == *"$keyword"* ]]; then
                    category="attractions"
                    break
                fi
            done
        fi
        
        # Process the file
        mkdir -p "$IMAGES_DIR/$category"
        local name="${filename%.*}"
        local ext="${filename##*.}"
        local clean_name=$(echo "$name" | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
        local output_file="$IMAGES_DIR/$category/$clean_name.$ext"
        
        optimize_image "$file" "$output_file"
        print_status "Categorized as '$category': $clean_name.$ext"
    done
}

# Function to generate logo config
generate_config() {
    print_status "Generating logo configuration..."
    
    local config_file="$SCRIPT_DIR/logo-config.json"
    echo "{" > "$config_file"
    
    local first_category=true
    for category_dir in "$IMAGES_DIR"/*; do
        [ -d "$category_dir" ] || continue
        
        local category=$(basename "$category_dir")
        
        if [ "$first_category" = false ]; then
            echo "," >> "$config_file"
        fi
        first_category=false
        
        echo "  \"$category\": [" >> "$config_file"
        
        local first_logo=true
        for logo_file in "$category_dir"/*.{png,jpg,jpeg,svg,webp} 2>/dev/null; do
            [ -f "$logo_file" ] || continue
            
            local filename=$(basename "$logo_file")
            local name="${filename%.*}"
            local alt_text=$(echo "$name" | sed 's/-/ /g' | sed 's/\b\w/\U&/g')
            
            if [ "$first_logo" = false ]; then
                echo "," >> "$config_file"
            fi
            first_logo=false
            
            echo -n "    { \"name\": \"$name\", \"alt\": \"$alt_text\" }" >> "$config_file"
        done
        
        echo "" >> "$config_file"
        echo "  ]" >> "$config_file"
    done
    
    echo "}" >> "$config_file"
    
    print_status "Logo configuration saved to: $config_file"
}

# Main script logic
main() {
    print_status "EstesPark.com Logo Upload Script"
    echo "=================================="
    
    if [ $# -eq 0 ]; then
        echo "Usage:"
        echo "  $0 auto-organize <source_directory>    # Auto-categorize and process all logos"
        echo "  $0 <category> <source_directory>       # Process logos for specific category"
        echo "  $0 generate-config                     # Generate logo configuration file"
        echo ""
        echo "Categories: lodging, dining, attractions, sponsors, general"
        exit 1
    fi
    
    if [ "$1" = "auto-organize" ]; then
        if [ $# -ne 2 ]; then
            print_error "Usage: $0 auto-organize <source_directory>"
            exit 1
        fi
        auto_organize "$2"
        generate_config
    elif [ "$1" = "generate-config" ]; then
        generate_config
    else
        if [ $# -ne 2 ]; then
            print_error "Usage: $0 <category> <source_directory>"
            exit 1
        fi
        process_logos "$1" "$2"
        generate_config
    fi
    
    print_status "Logo processing complete!"
    print_status "Commit and push changes to deploy: git add . && git commit -m 'Add partner logos' && git push"
}

# Run main function
main "$@"