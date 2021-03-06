import { Component, Input, OnInit } from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { BlogNavItem, BlogNavNode } from '../common/types/blog-nav';
import { BlogService } from '../common/services/blog.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-blog-nav',
    templateUrl: 'blog-nav.component.html',
    styleUrls: ['blog-nav.component.css']
})
export class BlogNavComponent implements OnInit {
    currentBlogId: number | null = null;
    currentBlogIdSubscription: Subscription | null = null;
    treeControl: NestedTreeControl<BlogNavNode> | null = null;
    dataSource: MatTreeNestedDataSource<BlogNavNode> | null = null;

    constructor(private blogService: BlogService) {
    }

    ngOnInit(): void {
        this.blogService.getBlogHeaders().subscribe((data) => {
            this.treeControl = new NestedTreeControl<BlogNavNode>(nodeChildren);
            this.dataSource = new MatTreeNestedDataSource<BlogNavNode>();
            this.dataSource.data = makeNodes(data);
        });

        this.currentBlogIdSubscription = this.blogService.getCurrentBlog().subscribe((blogId) => {
            this.currentBlogId = blogId;
        });
    }

    ngOnDestroy(): void {
        this.currentBlogIdSubscription.unsubscribe();
    }

    isReady(): boolean {
        return (this.treeControl !== null) && (this.dataSource !== null);
    }

    treeNodeHasChild(_: number, node: BlogNavNode): boolean {
        return nodeHasChildren(node);
    }

    getLink(node: BlogNavNode): string {
        return `/blog/${node.id}`;
    }

    isCurrent(node: BlogNavNode): boolean {
        return this.currentBlogId == node.id;
    }
}

function makeNodes(data: BlogNavItem[]): BlogNavNode[] {
    data = data.sort((a, b) => {
        // Sort descending by timestamp.
        if (a.timestamp > b.timestamp) {
            return -1;
        } else if (a.timestamp < b.timestamp) {
            return 1;
        } else {
            return 0;
        }
    });

    let nodes: BlogNavNode[] = [];
    data.forEach((item) => insert(nodes, item, "year"));

    return nodes;
}

function insert(nodes: BlogNavNode[], item: BlogNavItem, level: string) {
    if (level === "items") {
        nodes.push({ name: item.title, id: item.id });
    } else {
        let subtreeKey = null;
        let nextLevel = null;
    
        if (level === "year") {
            subtreeKey = item.timestamp.year.toString();
            nextLevel = "month";
        } else if (level === "month") {
            subtreeKey = item.timestamp.monthShort;
            nextLevel = "day";
        } else if (level === "day") {
            subtreeKey = item.timestamp.day.toString();
            nextLevel = "items";
        } else {
            throw "Unknown level (programmer error)";
        }
    
        let nextSubTree = nodes.find((n) => n.name === subtreeKey);

        if (nextSubTree === undefined) {
            nextSubTree = { name: subtreeKey, children: [] };
            nodes.push(nextSubTree);
        }
    
        insert(nextSubTree.children, item, nextLevel);
    }
}

function nodeChildren(node: BlogNavNode): BlogNavNode[] {
    return node.children;
}

function nodeHasChildren(node: BlogNavNode): boolean {
    return !!node.children && node.children.length > 0;
}
